/**
 * Hash functions used by LeanIMT+.
 *
 * `leaf` is a 3-input hash used to commit to indexed leaves:
 *   `leafCommitment = leaf(value, nextValue, TAG_LEAF)`.
 * `internal` is a 2-input hash used for inner Merkle nodes.
 *
 * The different arities (3 vs 2) act as **domain separation**: a leaf
 * commitment can never coincide with an internal-node hash, which closes a
 * second-preimage attack specific to indexed Merkle trees in which an
 * attacker tries to repackage an internal node as a leaf.
 */
export type LeanIMTPlusHashFunctions<N = bigint> = {
    leaf: (a: N, b: N, c: N) => N
    internal: (a: N, b: N) => N
}

/**
 * An indexed leaf of LeanIMT+. The leaves form an implicit sorted linked
 * list: a leaf with `nextValue = v` logically points to the leaf whose
 * `value = v`. The level-0 commitment for this leaf is
 * `hashLeaf(value, nextValue, TAG_LEAF)` and is stored in the LeanIMT, not
 * on the record itself.
 *
 * Three structural states are encoded purely by the field values:
 *  - sentinel (always at index 0): `value = 0`, `nextValue = firstReal > 0`.
 *  - active user leaf:              `value > 0`.
 *  - tombstone (after `remove`):    `value = 0`, `nextValue = 0`.
 */
export type LeanIMTPlusLeaf<N = bigint> = {
    value: N
    nextValue: N
}

/**
 * Discriminator for `LeanIMTPlusProof`. Encoded as `0 | 1` rather than a
 * string union so it is cheap to pass through ZK circuits and binary
 * serializers.
 *  - `0` (membership): `leaf.value === value`.
 *  - `1` (non-membership): `leaf` is the *low leaf* of `value`:
 *    `leaf.value < value` and either `leaf.nextValue > value` or
 *    `leaf.nextValue === 0` (tail).
 */
export type LeanIMTPlusProofType = 0 | 1

/**
 * Unified proof type. The `leaf` field together with `leafIndex` and
 * `siblings` is a standard Merkle proof of
 * `hashLeaf(leaf.value, leaf.nextValue, TAG_LEAF)` against `root`. The
 * `proofType` tells the verifier which extra check to run.
 */
export type LeanIMTPlusProof<N = bigint> = {
    proofType: LeanIMTPlusProofType
    root: N
    /** The value being asserted (in)existent. For membership this equals `leaf.value`. */
    value: N
    leaf: LeanIMTPlusLeaf<N>
    leafIndex: number
    siblings: N[]
}
