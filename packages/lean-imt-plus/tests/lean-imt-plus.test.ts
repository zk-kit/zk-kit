import { poseidon2, poseidon3 } from "poseidon-lite"
import {
    LeanIMTPlus,
    LeanIMTPlusProof,
    LeanIMTPlusHashFunctions,
    AVLOrderedIndex,
    defaultOrderedIndexFactory,
    avlFactory
} from "../src"

const hashes: LeanIMTPlusHashFunctions<bigint> = {
    leaf: (a, b, c) => poseidon3([a, b, c]),
    internal: (a, b) => poseidon2([a, b])
}

const newTree = () => new LeanIMTPlus<bigint>(hashes)

function leafValues<N>(tree: LeanIMTPlus<N>): Set<N> {
    return new Set(tree.leaves.map((l) => l.value))
}

describe("LeanIMTPlus", () => {
    describe("construction", () => {
        it("starts empty", () => {
            const t = newTree()
            expect(t.size).toBe(0)
            expect(t.depth).toBe(0)
            expect(t.leaves).toEqual([])
        })

        it("constructor accepts initial values", () => {
            const t = new LeanIMTPlus<bigint>(hashes, [10n, 20n, 5n])
            expect(t.size).toBe(3)
            expect(t.has(10n) && t.has(20n) && t.has(5n)).toBe(true)
            expect(leafValues(t)).toEqual(new Set([5n, 10n, 20n]))
        })

        it("rejects missing hash functions", () => {
            expect(() => new LeanIMTPlus<bigint>(undefined as never)).toThrow()
            expect(() => new LeanIMTPlus<bigint>({ leaf: undefined as never, internal: hashes.internal })).toThrow()
            expect(() => new LeanIMTPlus<bigint>({ leaf: hashes.leaf, internal: undefined as never })).toThrow()
        })
    })

    describe("first insert", () => {
        it("exposes a single user leaf (sentinel is internal)", () => {
            const t = newTree()
            t.insert(42n)

            expect(t.size).toBe(1)
            expect(t.leaves).toHaveLength(1)
            expect(t.leaves[0].value).toBe(42n)
            expect(t.leaves[0].nextValue).toBe(0n)
            expect(leafValues(t)).toEqual(new Set([42n]))
        })
    })

    describe("insert", () => {
        it("maintains sorted order across arbitrary insertion order", () => {
            const t = newTree()
            for (const v of [50n, 10n, 30n, 70n, 20n, 60n, 40n]) t.insert(v)

            expect(leafValues(t)).toEqual(new Set([10n, 20n, 30n, 40n, 50n, 60n, 70n]))

            const tail = t.leaves.find((l) => l.value === 70n)!
            expect(tail.nextValue).toBe(0n)
        })

        it("throws on the zero value", () => {
            const t = newTree()
            expect(() => t.insert(0n)).toThrow(/zero/i)
        })

        it("throws on a duplicate value", () => {
            const t = newTree()
            t.insert(7n)
            expect(() => t.insert(7n)).toThrow(/already exists/i)
        })

        it("indexOf and has skip the sentinel", () => {
            const t = newTree()
            t.insert(99n)
            expect(t.indexOf(0n)).toBe(-1)
            expect(t.has(0n)).toBe(false)
            expect(t.indexOf(99n)).toBe(1)
            expect(t.has(99n)).toBe(true)
            expect(t.indexOf(123n)).toBe(-1)
        })
    })

    describe("insertMany", () => {
        it("produces the same root as a sequence of single inserts", () => {
            const values = [11n, 7n, 25n, 3n, 18n, 50n, 42n]
            const a = newTree()
            for (const v of values) a.insert(v)
            const b = newTree()
            b.insertMany(values)
            expect(b.root).toBe(a.root)
            expect(b.leaves).toEqual(a.leaves)
        })

        it("throws on an empty input", () => {
            expect(() => newTree().insertMany([])).toThrow()
        })

        it("throws on a duplicate inside the batch", () => {
            expect(() => newTree().insertMany([3n, 5n, 3n])).toThrow(/already exists/i)
        })
    })

    describe("remove", () => {
        it("removes a middle value and rewires the linked list", () => {
            const t = newTree()
            t.insertMany([10n, 20n, 30n, 40n])
            t.remove(20n)

            expect(t.has(20n)).toBe(false)
            expect(t.size).toBe(3)
            expect(leafValues(t)).toEqual(new Set([10n, 30n, 40n]))

            // The leaf with value 10 should now point past 20 directly to 30.
            const ten = t.leaves.find((l) => l.value === 10n)!
            expect(ten.nextValue).toBe(30n)
        })

        it("removes the tail and rewires the new tail", () => {
            const t = newTree()
            t.insertMany([10n, 20n, 30n])
            t.remove(30n)
            const twenty = t.leaves.find((l) => l.value === 20n)!
            expect(twenty.nextValue).toBe(0n)
            expect(t.size).toBe(2)
        })

        it("supports removing every value (drained tree)", () => {
            const t = newTree()
            t.insertMany([5n, 10n, 15n])
            t.remove(5n)
            t.remove(10n)
            t.remove(15n)
            expect(t.size).toBe(0)
            expect(t.leaves).toEqual([])
        })

        it("can re-insert after a drained tree", () => {
            const t = newTree()
            t.insert(5n)
            t.remove(5n)
            t.insert(7n)
            expect(t.has(7n)).toBe(true)
            expect(t.size).toBe(1)
        })

        it("does not reuse tombstoned slots, a new slot is appended", () => {
            const t = newTree()
            t.insertMany([10n, 20n, 30n])
            t.remove(20n)
            t.insert(25n)
            // The tombstoned slot is never reused, so the insert appends a
            // fresh slot: sentinel + {10,20→tombstone} + {30} + {20 tombstone} + {25}.
            const after = JSON.parse(t.export()) as { leaves: { value: string; nextValue: string }[] }
            expect(after.leaves).toHaveLength(5) // sentinel + 3 active + 1 tombstone
            // The removed slot is still present as a tombstone.
            const tombstones = after.leaves.filter((l) => l.value === "0" && l.nextValue === "0")
            expect(tombstones).toHaveLength(1)
        })

        it("throws on removing the zero value or an absent value", () => {
            const t = newTree()
            t.insertMany([10n, 20n])
            expect(() => t.remove(0n)).toThrow(/zero/i)
            expect(() => t.remove(999n)).toThrow(/does not exist/i)
        })

        it("keeps proof generation correct after a removal", () => {
            const t = newTree()
            t.insertMany([10n, 20n, 30n, 40n])
            t.remove(20n)

            // Membership of a surviving value.
            const m = t.generateProof(30n)
            expect(t.verifyProof(m)).toBe(true)

            // Non-membership of the removed value, should now succeed.
            const nm = t.generateProof(20n)
            expect(nm.proofType).toBe(1)
            expect(t.verifyProof(nm)).toBe(true)
            // The low leaf for 20 is now {10, 30}.
            expect(nm.leaf.value).toBe(10n)
            expect(nm.leaf.nextValue).toBe(30n)
        })
    })

    describe("update", () => {
        it("replaces a value and keeps the tree consistent", () => {
            const t = newTree()
            t.insertMany([10n, 20n, 30n])
            t.update(20n, 25n)

            expect(t.has(20n)).toBe(false)
            expect(t.has(25n)).toBe(true)
            expect(leafValues(t)).toEqual(new Set([10n, 25n, 30n]))

            const ten = t.leaves.find((l) => l.value === 10n)!
            const twentyfive = t.leaves.find((l) => l.value === 25n)!
            expect(ten.nextValue).toBe(25n)
            expect(twentyfive.nextValue).toBe(30n)
        })

        it("updates in place: reuses the old slot, no growth or tombstone", () => {
            const t = newTree()
            t.insertMany([10n, 20n, 30n])
            const before = JSON.parse(t.export()) as { leaves: { value: string; nextValue: string }[] }
            t.update(20n, 25n)
            const after = JSON.parse(t.export()) as { leaves: { value: string; nextValue: string }[] }
            // 25 took over 20's physical slot: no new slot, no tombstone left behind.
            expect(after.leaves).toHaveLength(before.leaves.length)
            expect(after.leaves.filter((l) => l.value === "0" && l.nextValue === "0")).toHaveLength(0)
        })

        it("updates in place even when the value moves across the sorted order", () => {
            const t = newTree()
            t.insertMany([10n, 20n, 30n, 40n])
            const beforeLen = (JSON.parse(t.export()) as { leaves: unknown[] }).leaves.length
            t.update(20n, 50n) // 20 becomes the new tail
            const after = JSON.parse(t.export()) as { leaves: { value: string; nextValue: string }[] }
            expect(after.leaves).toHaveLength(beforeLen)
            expect(after.leaves.filter((l) => l.value === "0" && l.nextValue === "0")).toHaveLength(0)
            expect(leafValues(t)).toEqual(new Set([10n, 30n, 40n, 50n]))
        })

        it("can move a value across the sorted order", () => {
            const t = newTree()
            t.insertMany([10n, 20n, 30n, 40n])
            t.update(20n, 50n) // 20 moves to become the new tail
            expect(t.has(20n)).toBe(false)
            expect(t.has(50n)).toBe(true)
            const tail = t.leaves.find((l) => l.nextValue === 0n)!
            expect(tail.value).toBe(50n)
        })

        it("is a no-op when old and new value are equal", () => {
            const t = newTree()
            t.insertMany([1n, 2n, 3n])
            const rootBefore = t.root
            t.update(2n, 2n)
            expect(t.root).toBe(rootBefore)
        })

        it("validates equal values before treating the update as a no-op", () => {
            const t = newTree()
            expect(() => t.update(0n, 0n)).toThrow(/zero/i)
            expect(() => t.update(99n, 99n)).toThrow(/does not exist/i)
        })

        it("throws on missing old value, present new value, or zero new value", () => {
            const t = newTree()
            t.insertMany([10n, 20n])
            expect(() => t.update(99n, 100n)).toThrow(/does not exist/i)
            expect(() => t.update(10n, 20n)).toThrow(/already exists/i)
            expect(() => t.update(10n, 0n)).toThrow(/zero/i)
        })

        it("throws when the old value is zero even if the new value is valid", () => {
            const t = newTree()
            t.insertMany([10n, 20n])
            expect(() => t.update(0n, 5n)).toThrow(/zero/i)
        })
    })

    describe("generateProof / verifyProof", () => {
        let tree: LeanIMTPlus<bigint>
        beforeEach(() => {
            tree = newTree()
            tree.insertMany([10n, 25n, 7n, 3n, 41n, 18n])
        })

        it("returns a membership proof for inserted values", () => {
            const p = tree.generateProof(25n)
            expect(p.proofType).toBe(0)
            expect(p.value).toBe(25n)
            expect(p.leaf.value).toBe(25n)
            expect(tree.verifyProof(p)).toBe(true)
            expect(LeanIMTPlus.verifyProof(p, hashes)).toBe(true)
        })

        it("returns a non-membership proof for absent values", () => {
            const cases: { v: bigint; lowValue: bigint; lowNext: bigint }[] = [
                { v: 1n, lowValue: 0n, lowNext: 3n },
                { v: 20n, lowValue: 18n, lowNext: 25n },
                { v: 100n, lowValue: 41n, lowNext: 0n }
            ]
            for (const { v, lowValue, lowNext } of cases) {
                const p = tree.generateProof(v)
                expect(p.proofType).toBe(1)
                expect(p.value).toBe(v)
                expect(p.leaf.value).toBe(lowValue)
                expect(p.leaf.nextValue).toBe(lowNext)
                expect(tree.verifyProof(p)).toBe(true)
                expect(LeanIMTPlus.verifyProof(p, hashes)).toBe(true)
            }
        })

        it("rejects a tampered membership proof", () => {
            const p = tree.generateProof(10n)
            const bad: LeanIMTPlusProof<bigint> = { ...p, leaf: { ...p.leaf, value: 11n } }
            expect(tree.verifyProof(bad)).toBe(false)
        })

        it("rejects a forged non-membership proof claiming a member is absent", () => {
            const p = tree.generateProof(20n)
            const forged: LeanIMTPlusProof<bigint> = { ...p, value: 18n }
            expect(tree.verifyProof(forged)).toBe(false)
        })

        it("rejects a non-membership proof with mismatched lowLeaf.nextValue", () => {
            const p = tree.generateProof(20n)
            const bad: LeanIMTPlusProof<bigint> = { ...p, leaf: { ...p.leaf, nextValue: 21n } }
            expect(tree.verifyProof(bad)).toBe(false)
        })

        it("rejects a non-membership proof whose value is not below the low leaf's nextValue", () => {
            // Legit low leaf for 20 is {18, 25}. Claiming non-membership of 26
            // against that low leaf is invalid: 26 is not below nextValue 25.
            const p = tree.generateProof(20n)
            const bad: LeanIMTPlusProof<bigint> = { ...p, value: 26n }
            expect(tree.verifyProof(bad)).toBe(false)
        })

        it("rejects a membership proof whose proofType was flipped", () => {
            const p = tree.generateProof(10n)
            const flipped: LeanIMTPlusProof<bigint> = { ...p, proofType: 1 }
            expect(tree.verifyProof(flipped)).toBe(false)
        })

        it("rejects any proof targeting the zero value", () => {
            const p = tree.generateProof(20n)
            const zeroed: LeanIMTPlusProof<bigint> = { ...p, value: 0n }
            expect(tree.verifyProof(zeroed)).toBe(false)
        })

        it("rejects a proof with a malformed leafIndex (negative, non-integer, out of range)", () => {
            const p = tree.generateProof(25n)
            expect(tree.verifyProof({ ...p, leafIndex: -1 })).toBe(false)
            expect(tree.verifyProof({ ...p, leafIndex: 1.5 })).toBe(false)
            // siblings.length bits worth of canonical range; far higher must be rejected.
            expect(tree.verifyProof({ ...p, leafIndex: 1 << (p.siblings.length + 4) })).toBe(false)
        })

        it("rejects an invalid proofType discriminator", () => {
            const p = tree.generateProof(25n)
            expect(tree.verifyProof({ ...p, proofType: 2 as 0 | 1 })).toBe(false)
        })

        it("rejects a leafIndex with bits set above the sibling path length", () => {
            // A valid leafIndex must fit in `siblings.length` bits: the canonical
            // range is [0, 2 ** siblings.length). Anything at or above that bound
            // has stray high bits that walkPath would silently ignore.
            const p = tree.generateProof(25n)
            expect(tree.verifyProof({ ...p, leafIndex: 2 ** p.siblings.length })).toBe(false)
            // The largest in-range index is still structurally accepted (it fails
            // only on the root check), never rejected by the range guard.
            expect(tree.verifyProof({ ...p, leafIndex: 2 ** p.siblings.length - 1 })).toBe(false)
        })

        it("throws on zero or empty tree", () => {
            expect(() => tree.generateProof(0n)).toThrow(/sentinel/i)
            expect(() => newTree().generateProof(5n)).toThrow(/empty/i)
        })
    })

    describe("security: tombstone replay guard", () => {
        it("rejects a non-membership proof whose low leaf is a tombstone at index > 0", () => {
            // Build a tree, remove a value, then try to replay the removed
            // slot as the low leaf for some arbitrary target.
            const t = newTree()
            t.insertMany([10n, 20n, 30n])
            t.remove(20n)

            // Build a proof for 25n. The legit low leaf is {10, 30}.
            const p = t.generateProof(25n)
            expect(t.verifyProof(p)).toBe(true)

            // Forge a proof whose `leaf` is a tombstone ({0,0}). The
            // tombstone's commitment would still walk to root if we used its
            // physical index, but the security guard MUST reject because
            // leaf.value == 0 at a non-zero leafIndex is a tombstone.
            const forged: LeanIMTPlusProof<bigint> = {
                ...p,
                leaf: { value: 0n, nextValue: 0n }
                // leafIndex stays the same, non-zero in a populated tree.
            }
            expect(t.verifyProof(forged)).toBe(false)
        })

        it("still accepts a non-membership proof whose low leaf is the genuine sentinel at index 0", () => {
            const t = newTree()
            t.insertMany([10n, 20n, 30n])
            // 5n is below every active value, the legit low leaf is the
            // sentinel at index 0 (value=0, nextValue=10).
            const p = t.generateProof(5n)
            expect(p.leafIndex).toBe(0)
            expect(p.leaf.value).toBe(0n)
            expect(t.verifyProof(p)).toBe(true)
        })
    })

    describe("export / import", () => {
        it("roundtrips through JSON", () => {
            const a = newTree()
            a.insertMany([15n, 4n, 22n, 8n, 100n])
            const b = LeanIMTPlus.import<bigint>(hashes, a.export(), { validate: true })

            expect(b.root).toBe(a.root)
            expect(b.leaves).toEqual(a.leaves)
            expect(b.verifyProof(b.generateProof(22n))).toBe(true)
            expect(b.verifyProof(b.generateProof(50n))).toBe(true)
        })

        it("preserves the ability to insert, update, and remove after import", () => {
            const a = newTree()
            a.insertMany([1n, 2n, 3n])
            const b = LeanIMTPlus.import<bigint>(hashes, a.export(), { validate: true })
            a.insert(100n)
            b.insert(100n)
            expect(b.root).toBe(a.root)

            a.remove(2n)
            b.remove(2n)
            expect(b.root).toBe(a.root)

            a.update(3n, 50n)
            b.update(3n, 50n)
            expect(b.root).toBe(a.root)
        })

        it("rejects an import whose leaf records have been tampered with", () => {
            const a = newTree()
            a.insertMany([10n, 20n, 30n])
            const serialized = JSON.parse(a.export()) as {
                version: number
                nodes: string[][]
                leaves: { value: string; nextValue: string }[]
            }
            // Mutate one leaf record so its commitment no longer matches the
            // stored level-0 node. The validator must catch this.
            serialized.leaves[1] = { value: "999", nextValue: serialized.leaves[1].nextValue }
            expect(() => LeanIMTPlus.import<bigint>(hashes, JSON.stringify(serialized), { validate: true })).toThrow(
                /inconsistent|does not match/i
            )
        })

        it("rejects an import whose leaf count does not match the level-0 nodes", () => {
            const a = newTree()
            a.insertMany([10n, 20n, 30n])
            const s = JSON.parse(a.export()) as {
                nodes: string[][]
                leaves: { value: string; nextValue: string }[]
            }
            // Append an extra leaf record without a matching level-0 node.
            s.leaves.push({ value: "0", nextValue: "0" })
            expect(() => LeanIMTPlus.import<bigint>(hashes, JSON.stringify(s))).toThrow(/leaf count does not match/i)
        })

        it("rejects an import whose depth does not match the leaf count", () => {
            const a = newTree()
            a.insertMany([10n, 20n, 30n])
            const s = JSON.parse(a.export()) as { nodes: string[][] }
            // Drop the top level so the depth is smaller than the leaves require.
            s.nodes.pop()
            expect(() => LeanIMTPlus.import<bigint>(hashes, JSON.stringify(s))).toThrow(/depth/i)
        })

        it("rejects an import where an internal level has the wrong node count", () => {
            const a = newTree()
            a.insertMany([10n, 20n, 30n])
            const s = JSON.parse(a.export()) as { nodes: string[][] }
            // Add a spurious node to level 1 (sizes match at depth but not per level).
            s.nodes[1].push(s.nodes[1][0])
            expect(() => LeanIMTPlus.import<bigint>(hashes, JSON.stringify(s))).toThrow(/nodes, expected/i)
        })

        it("rejects an import where an internal node is inconsistent", () => {
            const a = newTree()
            a.insertMany([10n, 20n, 30n])
            const s = JSON.parse(a.export()) as { nodes: string[][] }
            // Corrupt an internal node while keeping every level's size valid.
            s.nodes[1][0] = "1"
            expect(() => LeanIMTPlus.import<bigint>(hashes, JSON.stringify(s))).toThrow(/inconsistent/i)
        })

        it("rejects an import with an unsupported format version", () => {
            const a = newTree()
            a.insertMany([10n, 20n, 30n])
            const serialized = JSON.parse(a.export())
            serialized.version = 999
            expect(() => LeanIMTPlus.import<bigint>(hashes, JSON.stringify(serialized))).toThrow(/version/i)
        })

        it("survives a roundtrip after a removal (tombstone preserved)", () => {
            const a = newTree()
            a.insertMany([10n, 20n, 30n])
            a.remove(20n)
            const b = LeanIMTPlus.import<bigint>(hashes, a.export(), { validate: true })
            expect(b.root).toBe(a.root)
            expect(b.has(20n)).toBe(false)
            expect(b.has(10n) && b.has(30n)).toBe(true)
            // Appends a fresh slot on next insert (the tombstone is not reused).
            b.insert(25n)
            a.insert(25n)
            expect(b.root).toBe(a.root)
        })
    })

    describe("custom N type", () => {
        it("works with `number`", () => {
            // Different hash functions for leaves (3-input) and internal nodes (2-input).
            const mix = (x: number, p: number) => ((x * p) ^ ((x >>> 16) * 40503)) >>> 0
            const numHashes: LeanIMTPlusHashFunctions<number> = {
                leaf: (a, b, c) => (mix(a, 2654435761) + mix(b, 40503) + mix(c, 2246822519)) >>> 0,
                internal: (a, b) => mix(a, 2654435761) ^ mix(b, 40503)
            }
            const t = new LeanIMTPlus<number>(numHashes, [], 0, 1, (a, b) => a < b)
            t.insertMany([5, 3, 9, 1])
            expect(t.has(3)).toBe(true)
            const m = t.generateProof(9)
            expect(m.proofType).toBe(0)
            expect(t.verifyProof(m)).toBe(true)
            const nm = t.generateProof(7)
            expect(nm.proofType).toBe(1)
            expect(t.verifyProof(nm)).toBe(true)
            t.update(9, 11)
            expect(t.has(11)).toBe(true)
            t.remove(11)
            expect(t.has(11)).toBe(false)
        })
    })

    describe("AVLOrderedIndex adapter", () => {
        it("throws when inserting a duplicate key", () => {
            const idx = new AVLOrderedIndex<bigint>((a, b) => a < b)
            idx.insert(5n, 0)
            expect(() => idx.insert(5n, 1)).toThrow(/duplicate key/i)
        })

        it("throws when removing an absent key", () => {
            const idx = new AVLOrderedIndex<bigint>((a, b) => a < b)
            idx.insert(5n, 0)
            expect(() => idx.remove(9n)).toThrow(/not found/i)
        })
    })

    describe("internal invariant guards", () => {
        // These defensive branches are unreachable through the public API
        // (every caller pre-checks the precondition), so exercise them
        // directly to lock in the guard behavior.
        it("_findLowLeafIndex throws when the tree has no leaves", () => {
            const t = newTree()
            expect(() => (t as unknown as { _findLowLeafIndex(v: bigint): number })._findLowLeafIndex(5n)).toThrow(
                /tree is empty/i
            )
        })

        it("_buildProof throws for an out-of-range physical index", () => {
            const t = newTree()
            t.insertMany([10n, 20n])
            const build = (
                t as unknown as { _buildProof(type: 0 | 1, v: bigint, i: number): unknown }
            )._buildProof.bind(t)
            expect(() => build(0, 10n, 999)).toThrow(/does not exist/i)
            expect(() => build(0, 10n, -1)).toThrow(/does not exist/i)
        })

        it("_removeOne throws when the value is absent", () => {
            const t = newTree()
            t.insertMany([10n, 20n])
            const removeOne = (t as unknown as { _removeOne(v: bigint, modified: Set<number>): void })._removeOne.bind(
                t
            )
            expect(() => removeOne(999n, new Set<number>())).toThrow(/does not exist/i)
        })

        it("_recompute is a no-op when nothing was modified", () => {
            const t = newTree()
            t.insertMany([10n, 20n])
            const rootBefore = t.root
            const recompute = (t as unknown as { _recompute(m: Set<number>): void })._recompute.bind(t)
            expect(() => recompute(new Set<number>())).not.toThrow()
            expect(t.root).toBe(rootBefore)
        })
    })

    describe("degenerate single-node tree", () => {
        // A depth-0 tree (a single level-0 node) cannot arise from the public
        // insert path — the first insert always writes a sentinel plus a leaf —
        // but an `import` can reconstruct one. It exercises the `size <= 1` /
        // `depth === 0` / empty-path branches that a two-node-minimum tree skips.
        const singleNode = () => {
            const value = 5n
            const nextValue = 0n
            const commitment = hashes.leaf(value, nextValue, 1n).toString()
            const data = JSON.stringify({
                version: 1,
                nodes: [[commitment]],
                leaves: [{ value: value.toString(), nextValue: nextValue.toString() }]
            })
            return LeanIMTPlus.import<bigint>(hashes, data, { validate: true })
        }

        it("imports and validates a single-node tree", () => {
            const t = singleNode()
            expect(t.depth).toBe(0)
            expect(t.root).toBe(hashes.leaf(5n, 0n, 1n))
        })

        it("_recompute handles a depth-0 tree", () => {
            const t = singleNode()
            const recompute = (t as unknown as { _recompute(m: Set<number>): void })._recompute.bind(t)
            expect(() => recompute(new Set<number>([0]))).not.toThrow()
            expect(t.depth).toBe(0)
        })

        it("_buildProof produces an empty path for a depth-0 tree", () => {
            const t = singleNode()
            const build = (
                t as unknown as { _buildProof(type: 0 | 1, v: bigint, i: number): LeanIMTPlusProof<bigint> }
            )._buildProof.bind(t)
            const proof = build(0, 5n, 0)
            expect(proof.leafIndex).toBe(0)
            expect(proof.siblings).toEqual([])
        })
    })

    describe("ordered-index factory barrel exports", () => {
        it("exposes working factories from the package entry point", () => {
            const lt = (a: unknown, b: unknown) => (a as bigint) < (b as bigint)
            for (const factory of [defaultOrderedIndexFactory, avlFactory]) {
                const idx = factory(lt)
                idx.insert(3n, 0)
                idx.insert(7n, 1)
                expect(idx.size).toBe(2)
                expect(idx.find(3n)).toBe(0)
                expect(idx.predecessor(7n)).toBe(0)
            }
        })
    })
})
