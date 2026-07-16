import { AvlTree } from "@datastructures-js/binary-search-tree"
import { OrderedIndex, OrderedIndexFactory } from "./ordered-index"

/**
 * `OrderedIndex<N>` backed by the AVL tree from
 * `@datastructures-js/binary-search-tree`, a widely used, zero-dependency,
 * MIT-licensed, TypeScript-native implementation. This module is a thin
 * *adapter*: it maps the small surface LeanIMT+ needs (`find`,
 * `predecessor`, `insert`, `remove`, `size`) onto the library's API. All
 * balancing logic lives in the library, not here.
 *
 * Swapping to a different ordered structure (skip list, B+ tree, …) means
 * writing another adapter that implements `OrderedIndex<N>` and exposing its
 * factory; `lean-imt-plus.ts` never changes.
 *
 * Each tree node stores an `Entry`: the leaf `value` as the ordering `key`
 * plus its physical `index` in the LeanIMT's level-0 array (the payload).
 * The comparator only inspects `key`, so a probe entry with a throwaway
 * `index` is enough to `find`/`remove`/`predecessor` by key.
 */
type Entry<N> = { key: N; index: number }

export class AVLOrderedIndex<N> implements OrderedIndex<N> {
    private readonly _tree: AvlTree<Entry<N>>

    constructor(lt: (a: N, b: N) => boolean) {
        this._tree = new AvlTree<Entry<N>>((a, b) => {
            if (lt(a.key, b.key)) return -1
            if (lt(b.key, a.key)) return 1
            return 0
        })
    }

    get size(): number {
        return this._tree.count()
    }

    find(key: N): number | null {
        const node = this._tree.find({ key, index: -1 })
        return node === null ? null : node.getValue().index
    }

    predecessor(key: N): number | null {
        // includeEqual = false → largest stored key strictly less than `key`.
        const node = this._tree.lowerBound({ key, index: -1 }, false)
        return node === null ? null : node.getValue().index
    }

    insert(key: N, value: number): void {
        // The library updates in place on an equal key rather than throwing.
        // LeanIMT+ guarantees uniqueness, so treat a collision as a bug.
        if (this.find(key) !== null) {
            throw new Error("AVL: duplicate key on insert")
        }
        this._tree.insert({ key, index: value })
    }

    remove(key: N): void {
        const removed = this._tree.remove({ key, index: -1 })
        if (!removed) {
            throw new Error("AVL: key not found on remove")
        }
    }
}

/** Default factory: AVL-backed ordered index. */
export const avlFactory: OrderedIndexFactory<unknown> = ((lt: (a: unknown, b: unknown) => boolean) =>
    new AVLOrderedIndex<unknown>(lt)) as OrderedIndexFactory<unknown>
