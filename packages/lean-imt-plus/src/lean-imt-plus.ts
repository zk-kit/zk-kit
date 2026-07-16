import { LeanIMTPlusHashFunctions, LeanIMTPlusLeaf, LeanIMTPlusProof, LeanIMTPlusProofType } from "./types"
import { OrderedIndex, OrderedIndexFactory } from "./ordered-index"
import { defaultOrderedIndexFactory } from "./default-ordered-index"

const DEFAULT_ZERO: unknown = BigInt(0)
const DEFAULT_ONE: unknown = BigInt(1)
const DEFAULT_LT: (a: unknown, b: unknown) => boolean = (a, b) => (a as bigint) < (b as bigint)

/** Serialized format version. Bumped on any breaking change to `export`. */
const FORMAT_VERSION = 1

/** Walks a Merkle path from `leaf` to the root using packed `index` bits. */
function walkPath<N>(leaf: N, index: number, siblings: N[], internalHash: (a: N, b: N) => N): N {
    let node = leaf
    for (let i = 0; i < siblings.length; i += 1) {
        node = ((index >> i) & 1) === 1 ? internalHash(siblings[i], node) : internalHash(node, siblings[i])
    }
    return node
}

/**
 * LeanIMT+: a LeanIMT extended with non-membership proofs by adopting the
 * indexed-leaf design from the Indexed Merkle Tree.
 *
 * Indexed leaves have shape `{ value, nextValue }` and form an *implicit*
 * sorted linked list. The level-0 commitment is
 * `hashLeaf(value, nextValue, TAG_LEAF)`, a 3-input hash that is
 * domain-separated from the 2-input internal-node hash. This separation
 * prevents an attacker from repackaging an internal node as a leaf.
 *
 * Three leaf states are encoded via the field values themselves:
 *   - sentinel  (index 0): `value = 0`, `nextValue = firstReal > 0`.
 *   - active:               `value > 0`.
 *   - tombstone (removed):  `value = 0`, `nextValue = 0`.
 *
 * Predecessor lookup is backed by an injected `OrderedIndex<N>` (a
 * self-balancing tree by default). Pass a custom factory to swap in a
 * different data structure (skip list, B+ tree, etc.) without touching the
 * tree code.
 */
export default class LeanIMTPlus<N = bigint> {
    /** Levels of the underlying LeanIMT. `_nodes[0]` holds leaf commitments. */
    private _nodes: N[][]

    /** Indexed-leaf records, parallel to `_nodes[0]`. */
    private _leaves: LeanIMTPlusLeaf<N>[]

    /** Ordered index keyed by `value`, payload = physical index in `_leaves`. */
    private _index: OrderedIndex<N>

    private readonly _hashes: LeanIMTPlusHashFunctions<N>
    private readonly _zero: N
    private readonly _one: N
    private readonly _lt: (a: N, b: N) => boolean
    private readonly _indexFactory: OrderedIndexFactory<N>

    /**
     * @param hashes 3-input leaf hash and 2-input internal hash.
     * @param values Optional initial values, inserted in order.
     * @param zero Zero element (defaults to `0n`). Reserved for the sentinel and tombstones.
     * @param one TAG_LEAF constant (defaults to `1n`). Mixed into the leaf hash for domain separation.
     * @param lt Strict less-than comparator (defaults to native `<` for bigints).
     * @param orderedIndex Factory for the predecessor-lookup structure (defaults to the built-in ordered index).
     */
    constructor(
        hashes: LeanIMTPlusHashFunctions<N>,
        values: N[] = [],
        zero: N = DEFAULT_ZERO as N,
        one: N = DEFAULT_ONE as N,
        lt: (a: N, b: N) => boolean = DEFAULT_LT as (a: N, b: N) => boolean,
        orderedIndex: OrderedIndexFactory<N> = defaultOrderedIndexFactory as OrderedIndexFactory<N>
    ) {
        if (!hashes || typeof hashes.leaf !== "function" || typeof hashes.internal !== "function") {
            throw new TypeError("hashes.leaf and hashes.internal must be functions")
        }

        this._hashes = hashes
        this._zero = zero
        this._one = one
        this._lt = lt
        this._indexFactory = orderedIndex
        this._nodes = [[]]
        this._leaves = []
        this._index = orderedIndex(lt)

        if (values.length > 0) this.insertMany(values)
    }

    public get root(): N {
        return this._nodes[this.depth][0]
    }

    public get depth(): number {
        return this._nodes.length - 1
    }

    /** Number of active user-inserted values. Excludes sentinel and tombstones. */
    public get size(): number {
        return this._index.size
    }

    /**
     * Defensive copy of the user-inserted indexed leaves. Excludes the
     * sentinel and any tombstoned slots. Order is the physical insertion
     * order, not sorted order.
     */
    public get leaves(): LeanIMTPlusLeaf<N>[] {
        const out: LeanIMTPlusLeaf<N>[] = []
        for (let i = 1; i < this._leaves.length; i += 1) {
            const l = this._leaves[i]
            if (!this._isTombstone(l)) {
                out.push({ ...l })
            }
        }
        return out
    }

    /**
     * Returns the physical index of the leaf whose `value` equals `v`, or
     * -1 if absent. The sentinel and tombstones are never reported.
     */
    public indexOf(v: N): number {
        if (this._eq(v, this._zero)) return -1
        const idx = this._index.find(v)
        return idx === null ? -1 : idx
    }

    public has(v: N): boolean {
        return this.indexOf(v) !== -1
    }

    /** Inserts `v`. Throws if `v` is `zero` or already present. */
    public insert(v: N) {
        this._insertBatch([v])
    }

    /**
     * Inserts each value in order. More efficient than calling `insert` N
     * times because each affected internal node is rehashed at most once
     * even when several inserts share ancestors.
     *
     * Note: this is *not* transactional. If a value mid-batch fails (e.g.,
     * because it duplicates an earlier value in the same batch), prior
     * inserts have already been committed.
     */
    public insertMany(values: N[]) {
        if (values.length === 0) throw new Error("There are no values to add")
        this._insertBatch(values)
    }

    /**
     * Replaces `oldValue` with `newValue`. Throws if `oldValue` is absent,
     * `newValue` is already present, or `newValue` is `zero`. All
     * preconditions are checked before any mutation, so the call either
     * succeeds fully or leaves the tree unchanged.
     *
     * The new value is written **in place**, into the old value's physical
     * slot: `update` relinks the sorted list around the old value, then
     * splices the new value in while reusing that same slot. The leaf array
     * never grows and no tombstone is created, unlike a `remove` followed by
     * a separate `insert`.
     */
    public update(oldValue: N, newValue: N) {
        if (this._eq(oldValue, newValue)) return
        if (this._eq(newValue, this._zero)) throw new Error("Cannot update to the zero value")
        if (this._eq(oldValue, this._zero)) throw new Error("Cannot update the zero value")
        if (!this.has(oldValue)) throw new Error("Value to update does not exist in the tree")
        if (this.has(newValue)) throw new Error("Target value already exists in the tree")

        const modified = new Set<number>()
        const slot = this._index.find(oldValue)! // physical slot to reuse for newValue
        this._removeOne(oldValue, modified)
        this._insertOne(newValue, modified, slot)
        this._recompute(modified)
    }

    /**
     * Removes `value` from the tree. The slot is *tombstoned* (`{0, 0}`)
     * rather than physically deleted: Merkle positions are addressable, so
     * the slot stays but its commitment becomes the canonical tombstone
     * commitment `hashLeaf(0, 0, TAG_LEAF)`. The slot is never reused: once
     * removed it stays a tombstone for the life of the tree.
     */
    public remove(value: N) {
        if (this._eq(value, this._zero)) throw new Error("Cannot remove the zero value")
        if (!this.has(value)) throw new Error("Value to remove does not exist in the tree")

        const modified = new Set<number>()
        this._removeOne(value, modified)
        this._recompute(modified)
    }

    /**
     * Generates a proof for `value`. Returns a membership proof
     * (`proofType: 0`) if `value` is in the tree, or a non-membership
     * proof (`proofType: 1`) otherwise. Throws if the tree is empty or
     * `value === zero`.
     */
    public generateProof(value: N): LeanIMTPlusProof<N> {
        if (this._eq(value, this._zero)) throw new Error("zero is reserved for the sentinel and tombstones")
        if (this._leaves.length === 0) throw new Error("Tree is empty")

        const idx = this.indexOf(value)
        if (idx !== -1) return this._buildProof(0, value, idx)
        const lowIdx = this._findLowLeafIndex(value)
        return this._buildProof(1, value, lowIdx)
    }

    public verifyProof(proof: LeanIMTPlusProof<N>): boolean {
        return LeanIMTPlus.verifyProof(proof, this._hashes, this._zero, this._one, this._lt)
    }

    public static verifyProof<N>(
        proof: LeanIMTPlusProof<N>,
        hashes: LeanIMTPlusHashFunctions<N>,
        zero: N = DEFAULT_ZERO as N,
        one: N = DEFAULT_ONE as N,
        lt: (a: N, b: N) => boolean = DEFAULT_LT as (a: N, b: N) => boolean
    ): boolean {
        const { proofType, root, value, leaf, leafIndex, siblings } = proof
        const eq = (a: N, b: N) => !lt(a, b) && !lt(b, a)

        // Structural sanity checks.
        if (proofType !== 0 && proofType !== 1) return false
        if (!Number.isInteger(leafIndex) || leafIndex < 0) return false
        // leafIndex's path bits live in [0..siblings.length); higher bits
        // must be zero so the encoding is canonical.
        if (siblings.length < 32 && leafIndex >= 1 << siblings.length) return false
        if (siblings.length >= 32 && leafIndex >= Number.MAX_SAFE_INTEGER) return false

        // Reject the zero value for either proof type, it would collide with
        // the sentinel's value and (for non-membership) with the tombstone state.
        if (eq(value, zero)) return false

        if (proofType === 0) {
            // Membership: leaf.value == value. Active values are > 0, and we
            // already rejected value == 0, so this also guarantees the leaf
            // is not a tombstone.
            if (!eq(leaf.value, value)) return false
        } else {
            // Non-membership low-leaf check: leaf.value < value < leaf.nextValue
            // (or leaf.nextValue == 0 for the tail).
            if (!lt(leaf.value, value)) return false
            const isTail = eq(leaf.nextValue, zero)
            if (!isTail && !lt(value, leaf.nextValue)) return false

            // Tombstone replay guard: only the sentinel (index 0) may have
            // value == 0. Any other leaf with value == 0 is a tombstone and
            // must not be accepted as a low leaf, otherwise an attacker
            // could replay a removed slot to forge non-membership of any v.
            if (eq(leaf.value, zero) && leafIndex !== 0) return false
        }

        const commitment = hashes.leaf(leaf.value, leaf.nextValue, one)
        return walkPath(commitment, leafIndex, siblings, hashes.internal) === root
    }

    /**
     * Serializes the full tree state. `bigint` values are written as
     * decimal strings. The output includes a `version` field that
     * `import` enforces.
     */
    public export(): string {
        return JSON.stringify(
            {
                version: FORMAT_VERSION,
                nodes: this._nodes,
                leaves: this._leaves
            },
            (_, v) => (typeof v === "bigint" ? v.toString() : v)
        )
    }

    /**
     * Reconstructs a tree from `export`'s output.
     *
     * Pass `validate: true` (default) to recompute every commitment from
     * the supplied leaf records and verify it matches the supplied node
     * hashes. This protects against tampered serializations that ship
     * inconsistent `leaves` and `nodes`. Set to `false` only for trusted,
     * performance-critical paths.
     */
    public static import<N = bigint>(
        hashes: LeanIMTPlusHashFunctions<N>,
        data: string,
        options: {
            zero?: N
            one?: N
            lt?: (a: N, b: N) => boolean
            orderedIndex?: OrderedIndexFactory<N>
            map?: (value: string) => N
            validate?: boolean
        } = {}
    ): LeanIMTPlus<N> {
        const zero = options.zero ?? (DEFAULT_ZERO as N)
        const one = options.one ?? (DEFAULT_ONE as N)
        const lt = options.lt ?? (DEFAULT_LT as (a: N, b: N) => boolean)
        const orderedIndex = options.orderedIndex ?? (defaultOrderedIndexFactory as OrderedIndexFactory<N>)
        const map = options.map ?? ((s: string) => BigInt(s) as unknown as N)
        const validate = options.validate ?? true

        const parsed = JSON.parse(data) as {
            version?: number
            nodes: string[][]
            leaves: { value: string; nextValue: string }[]
        }

        if (parsed.version !== undefined && parsed.version !== FORMAT_VERSION) {
            throw new Error(
                `Unsupported export format version ${parsed.version} (this build supports ${FORMAT_VERSION})`
            )
        }

        const tree = new LeanIMTPlus<N>(hashes, [], zero, one, lt, orderedIndex)
        tree._nodes = parsed.nodes.map((level) => level.map(map))
        tree._leaves = parsed.leaves.map((l) => ({ value: map(l.value), nextValue: map(l.nextValue) }))

        // Rebuild the ordered index from the active leaves.
        for (let i = 1; i < tree._leaves.length; i += 1) {
            const l = tree._leaves[i]
            if (!tree._isTombstone(l)) {
                tree._index.insert(l.value, i)
            }
        }

        if (validate) tree._validateConsistency()
        return tree
    }

    // ─── internals ────────────────────────────────────────────────────────

    private _eq(a: N, b: N): boolean {
        return !this._lt(a, b) && !this._lt(b, a)
    }

    /** True if a leaf record matches the tombstone shape `{0, 0}`. */
    private _isTombstone(l: LeanIMTPlusLeaf<N>): boolean {
        return this._eq(l.value, this._zero) && this._eq(l.nextValue, this._zero)
    }

    /**
     * Returns the physical index of the *low leaf* of `v`: the active
     * leaf `L` such that `L.value < v` and either `L.nextValue > v` or
     * `L` is the tail. If `v` is smaller than every active value, the low
     * leaf is the sentinel at index 0.
     */
    private _findLowLeafIndex(v: N): number {
        const predIdx = this._index.predecessor(v)
        if (predIdx !== null) return predIdx
        if (this._leaves.length > 0) return 0
        throw new Error("invariant violated: tree is empty, cannot locate a low leaf")
    }

    private _insertOne(v: N, modified: Set<number>, reuseSlot?: number) {
        if (this._eq(v, this._zero)) throw new Error("Cannot insert the zero value")

        // True first-ever insert: append sentinel `{0, v}` then `{v, 0}`.
        if (this._leaves.length === 0) {
            this._appendLeaf({ value: this._zero, nextValue: v }, modified)
            const idx = this._appendLeaf({ value: v, nextValue: this._zero }, modified)
            this._index.insert(v, idx)
            return
        }

        // Drained tree (only sentinel/tombstones, no active values):
        // rewrite the sentinel and place the new leaf.
        if (this._index.size === 0) {
            this._writeLeaf(0, { value: this._zero, nextValue: v })
            modified.add(0)
            const newIdx = this._placeLeaf({ value: v, nextValue: this._zero }, modified, reuseSlot)
            this._index.insert(v, newIdx)
            return
        }

        const lowIdx = this._findLowLeafIndex(v)
        const low = this._leaves[lowIdx]
        if (!this._eq(low.nextValue, this._zero) && this._eq(low.nextValue, v)) {
            throw new Error("Value already exists in the tree")
        }

        const newIdx = this._placeLeaf({ value: v, nextValue: low.nextValue }, modified, reuseSlot)
        this._writeLeaf(lowIdx, { value: low.value, nextValue: v })
        modified.add(lowIdx)
        this._index.insert(v, newIdx)
    }

    private _removeOne(v: N, modified: Set<number>) {
        const idx = this._index.find(v)
        if (idx === null) throw new Error("Value to remove does not exist in the tree")

        const cur = this._leaves[idx]
        const predValueIdx = this._index.predecessor(v)
        const predPhysIdx = predValueIdx ?? 0 // sentinel if no smaller active value

        const pred = this._leaves[predPhysIdx]
        this._writeLeaf(predPhysIdx, { value: pred.value, nextValue: cur.nextValue })
        modified.add(predPhysIdx)

        this._writeLeaf(idx, { value: this._zero, nextValue: this._zero })
        modified.add(idx)
        this._index.remove(v)
    }

    private _insertBatch(values: N[]) {
        const modified = new Set<number>()
        for (const v of values) this._insertOne(v, modified)
        this._recompute(modified)
    }

    /**
     * Writes `leaf` into `reuseSlot` when one is supplied (used by `update`
     * to keep the modified value in its original physical slot), otherwise
     * appends a fresh slot. Returns the physical index written.
     */
    private _placeLeaf(leaf: LeanIMTPlusLeaf<N>, modified: Set<number>, reuseSlot?: number): number {
        if (reuseSlot !== undefined) {
            this._writeLeaf(reuseSlot, leaf)
            modified.add(reuseSlot)
            return reuseSlot
        }
        return this._appendLeaf(leaf, modified)
    }

    private _writeLeaf(index: number, leaf: LeanIMTPlusLeaf<N>) {
        this._leaves[index] = leaf
        this._nodes[0][index] = this._hashes.leaf(leaf.value, leaf.nextValue, this._one)
    }

    private _appendLeaf(leaf: LeanIMTPlusLeaf<N>, modified: Set<number>): number {
        const index = this._leaves.length
        this._leaves.push(leaf)
        this._nodes[0].push(this._hashes.leaf(leaf.value, leaf.nextValue, this._one))
        modified.add(index)
        return index
    }

    private _recompute(modifiedLeaves: Set<number>) {
        if (modifiedLeaves.size === 0) return
        const size = this._nodes[0].length
        const targetDepth = size <= 1 ? 0 : Math.ceil(Math.log2(size))
        while (this.depth < targetDepth) this._nodes.push([])

        if (this.depth === 0) return

        let modified = new Set<number>()
        for (const i of modifiedLeaves) modified.add(i >> 1)

        for (let level = 1; level <= this.depth; level += 1) {
            const next = new Set<number>()
            for (const idx of modified) {
                const left = this._nodes[level - 1][2 * idx]
                const right = this._nodes[level - 1][2 * idx + 1]
                this._nodes[level][idx] = right !== undefined ? this._hashes.internal(left, right) : left
                next.add(idx >> 1)
            }
            modified = next
        }
    }

    /**
     * Rebuilds every commitment from the leaf records and compares against
     * `_nodes`. Throws if any mismatch is found. Used by `import` to
     * reject tampered serializations.
     */
    private _validateConsistency() {
        const leafLevel = this._nodes[0]
        if (leafLevel.length !== this._leaves.length) {
            throw new Error("import: leaf count does not match level-0 nodes")
        }
        for (let i = 0; i < this._leaves.length; i += 1) {
            const l = this._leaves[i]
            const expected = this._hashes.leaf(l.value, l.nextValue, this._one)
            if (!this._eq(expected, leafLevel[i])) {
                throw new Error(`import: leaf commitment at index ${i} does not match the supplied node`)
            }
        }
        // Internal levels.
        const size = leafLevel.length
        const expectedDepth = size <= 1 ? 0 : Math.ceil(Math.log2(size))
        if (this.depth !== expectedDepth) {
            throw new Error(`import: tree depth ${this.depth} does not match expected ${expectedDepth}`)
        }
        for (let level = 1; level <= this.depth; level += 1) {
            const prev = this._nodes[level - 1]
            const cur = this._nodes[level]
            const expectedSize = Math.ceil(prev.length / 2)
            if (cur.length !== expectedSize) {
                throw new Error(`import: level ${level} has ${cur.length} nodes, expected ${expectedSize}`)
            }
            for (let i = 0; i < cur.length; i += 1) {
                const left = prev[2 * i]
                const right = prev[2 * i + 1]
                const expected = right !== undefined ? this._hashes.internal(left, right) : left
                if (!this._eq(expected, cur[i])) {
                    throw new Error(`import: internal node at level ${level} index ${i} is inconsistent`)
                }
            }
        }
    }

    private _buildProof(proofType: LeanIMTPlusProofType, value: N, physIndex: number): LeanIMTPlusProof<N> {
        if (physIndex < 0 || physIndex >= this._leaves.length) {
            throw new Error(`The leaf at index '${physIndex}' does not exist in this tree`)
        }

        const leaf = { ...this._leaves[physIndex] }
        const siblings: N[] = []
        const path: number[] = []

        let i = physIndex
        for (let level = 0; level < this.depth; level += 1) {
            const isRight = i & 1
            const sibling = this._nodes[level][isRight ? i - 1 : i + 1]
            if (sibling !== undefined) {
                path.push(isRight)
                siblings.push(sibling)
            }
            i >>= 1
        }

        return {
            proofType,
            root: this.root,
            value,
            leaf,
            leafIndex: path.length === 0 ? 0 : Number.parseInt(path.reverse().join(""), 2),
            siblings
        }
    }
}
