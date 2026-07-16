import { avlFactory } from "./avl"
import { OrderedIndexFactory } from "./ordered-index"

/**
 * The ordered-index implementation LeanIMT+ falls back to when the caller
 * does not inject one. Deliberately structure-agnostic in both name and
 * location: `leanimt-plus.ts` imports *this* binding, never a concrete tree.
 *
 * To switch the backing structure (red-black tree, skip list, B+ tree, …),
 * write a new adapter implementing `OrderedIndex<N>` and repoint this single
 * binding: no other file changes, and the name imported by the tree code
 * stays the same.
 *
 * Currently backed by the AVL adapter in `./avl`.
 */
// eslint-disable-next-line import/prefer-default-export
export const defaultOrderedIndexFactory: OrderedIndexFactory<unknown> = avlFactory
