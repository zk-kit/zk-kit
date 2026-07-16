/**
 * Minimal interface for the auxiliary index that backs LeanIMT+'s
 * predecessor lookups. LeanIMT+ depends only on this surface, so the
 * concrete data structure can be swapped without touching the tree code.
 *
 * Keys are leaf values (`N`); payloads are physical indices in the
 * underlying LeanIMT's level-0 array. All operations are expected to be
 * `O(log n)` on the data structure's own size for the implementation to
 * scale to large trees.
 */
export interface OrderedIndex<N> {
    /** Number of stored (key, payload) pairs. */
    readonly size: number

    /** Returns the payload stored at `key`, or `null` if absent. */
    find(key: N): number | null

    /**
     * Returns the payload of the **largest stored key strictly less than**
     * `key`, or `null` if no such key exists. Used by LeanIMT+ to locate
     * the low leaf for non-membership proofs and to splice new values into
     * the implicit sorted linked list.
     */
    predecessor(key: N): number | null

    /**
     * Inserts a new `(key, payload)` pair. The structure rejects duplicate
     * keys: LeanIMT+ guarantees uniqueness via its own checks, so
     * implementations may throw on duplicates rather than silently update.
     */
    insert(key: N, value: number): void

    /** Removes the pair stored at `key`. Throws if `key` is absent. */
    remove(key: N): void
}

/**
 * Factory that constructs a fresh `OrderedIndex<N>` instance with the
 * supplied strict less-than comparator. Pass a factory to LeanIMT+ to swap
 * in a different ordered structure (e.g., a skip list or B+ tree).
 */
export type OrderedIndexFactory<N> = (lt: (a: N, b: N) => boolean) => OrderedIndex<N>
