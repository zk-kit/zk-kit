<p align="center">
    <h1 align="center">
        Lean Incremental Merkle Tree Plus
    </h1>
    <p align="center">Lean Incremental Merkle tree with non-membership proofs implementation in TypeScript.</p>
</p>

<p align="center">
    <a href="https://github.com/zk-kit/zk-kit">
        <img src="https://img.shields.io/badge/project-zk--kit-blue.svg?style=flat-square">
    </a>
    <a href="https://github.com/zk-kit/zk-kit/tree/main/packages/lean-imt-plus/LICENSE">
        <img alt="NPM license" src="https://img.shields.io/npm/l/%40zk-kit%2Flean-imt-plus?style=flat-square">
    </a>
    <a href="https://www.npmjs.com/package/@zk-kit/lean-imt-plus">
        <img alt="NPM version" src="https://img.shields.io/npm/v/@zk-kit/lean-imt-plus?style=flat-square" />
    </a>
    <a href="https://npmjs.org/package/@zk-kit/lean-imt-plus">
        <img alt="Downloads" src="https://img.shields.io/npm/dm/@zk-kit/lean-imt-plus.svg?style=flat-square" />
    </a>
    <a href="https://bundlephobia.com/package/@zk-kit/lean-imt-plus">
        <img alt="npm bundle size (scoped)" src="https://img.shields.io/bundlephobia/minzip/@zk-kit/lean-imt-plus" />
    </a>
    <a href="https://eslint.org/">
        <img alt="Linter eslint" src="https://img.shields.io/badge/linter-eslint-8080f2?style=flat-square&logo=eslint" />
    </a>
    <a href="https://prettier.io/">
        <img alt="Code style prettier" src="https://img.shields.io/badge/code%20style-prettier-f8bc45?style=flat-square&logo=prettier" />
    </a>
</p>

<div align="center">
    <h4>
        <a href="https://appliedzkp.org/discord">
            🗣️ Chat &amp; Support
        </a>
    </h4>
</div>

LeanIMT+ is an optimized Incremental Merkle Tree designed to support efficient membership **and non-membership** proofs. It keeps the indexed-leaf linked-list trick from the [Indexed Merkle Tree](https://eprint.iacr.org/2021/1263.pdf) ("low leaf" non-membership) but builds it on the [LeanIMT](https://github.com/zk-kit/zk-kit/tree/main/packages/lean-imt) construction, so the depth stays **dynamic** and there are **no zero hashes**.

> [!IMPORTANT]
> If you only need **membership** proofs, use [@zk-kit/lean-imt](https://github.com/zk-kit/zk-kit/tree/main/packages/lean-imt) instead: it is more optimized for that use case. Reach for LeanIMT+ only when you need efficient **non-membership** proofs.

The result is a simple structure that allows:

-   Efficient incremental insertions (single and batched)
-   Compact membership proofs
-   Efficient non-membership proofs
-   Post-quantum safety (assuming the underlying hash function is post-quantum secure)

## Overview

LeanIMT+ is a sorted incremental Merkle tree where:

-   Leaves are linked together in **sorted order** by `value`. Each leaf stores two fields, `value` and `nextValue`: a leaf whose `nextValue` is `v` refers to the leaf whose `value` is `v`.
-   Each leaf commits to its data as `leafHash = H_leaf(value, nextValue, TAG_LEAF)`, a **3-input** hash that is domain-separated from the 2-input internal-node hash. This prevents a second-preimage attack in which an attacker repackages an internal node as a leaf.
-   Parent nodes follow the LeanIMT construction: `parent = H_internal(left, right)`. When a level has an odd number of nodes, the unpaired node is promoted unchanged to the next level (no zero hash, no extra hash call).

`0` is **not** a valid value: it is reserved as the sentinel value (index `0`) and as the end-of-list marker, so the last leaf in the linked list always has `nextValue = 0`. `remove` tombstones a slot (`{0, 0}`) instead of deleting it and never reuses it; a verifier-side replay guard prevents a removed slot from being presented as a low leaf.

Predecessor lookups are served by a pluggable **ordered index** (a self-balancing AVL tree by default), so `find` / `predecessor` / `insert` / `remove` run in `O(log n)`. A different ordered structure (skip list, B+ tree, …) can be injected via the `orderedIndex` factory without touching the tree code.

---

## 🛠 Install

### npm or yarn

Install the `@zk-kit/lean-imt-plus` package with npm:

```bash
npm i @zk-kit/lean-imt-plus --save
```

or yarn:

```bash
yarn add @zk-kit/lean-imt-plus
```

### CDN

You can also load it using a `script` tag using [unpkg](https://unpkg.com/):

```html
<script src="https://unpkg.com/@zk-kit/lean-imt-plus"></script>
```

or [JSDelivr](https://www.jsdelivr.com/):

```html
<script src="https://cdn.jsdelivr.net/npm/@zk-kit/lean-imt-plus"></script>
```

## 📜 Usage

```typescript
import { LeanIMTPlus } from "@zk-kit/lean-imt-plus"
import { poseidon2, poseidon3 } from "poseidon-lite"

// LeanIMT+ requires two hash functions: a 3-input leaf hash (domain-separated)
// and a 2-input internal-node hash.
const hashes = {
    leaf: (a, b, c) => poseidon3([a, b, c]),
    internal: (a, b) => poseidon2([a, b])
}

// Create an instance of a LeanIMT+ tree by providing the hash functions.
const tree = new LeanIMTPlus(hashes)

// You can also initialize a tree with a given list of values.
// const values = [10n, 20n, 5n]
// new LeanIMTPlus(hashes, values)

// LeanIMT+ is strictly typed. Default type for values is 'bigint',
// but you can supply a custom zero, TAG_LEAF constant, and comparator
// for other types.
// new LeanIMTPlus<number>(numHashes, [], 0, 1, (a, b) => a < b)

// Insert values (0n is reserved and cannot be inserted).
tree.insert(5n)

// Insert several values at once (more efficient than repeated inserts).
tree.insertMany([10n, 20n])

// The root of the tree.
console.log(tree.root)
// The depth of the tree.
console.log(tree.depth)
// The number of active values (excludes the sentinel and tombstones).
console.log(tree.size)
// The active user leaves ({ value, nextValue } records).
console.log(tree.leaves)

// Check whether a value is in the tree.
console.log(tree.has(10n)) // true
console.log(tree.indexOf(10n)) // physical index, or -1 if absent

// Replace a value in place (cheaper than remove + insert).
tree.update(10n, 15n)

// Remove a value (tombstones its slot).
tree.remove(20n)

// Generate a proof. If the value is present you get a membership proof
// (proofType: 0); otherwise a non-membership proof (proofType: 1).
const membership = tree.generateProof(15n)
console.log(membership.proofType) // 0
console.log(tree.verifyProof(membership)) // true

const nonMembership = tree.generateProof(999n)
console.log(nonMembership.proofType) // 1
console.log(tree.verifyProof(nonMembership)) // true

// Proofs can also be verified statically.
console.log(LeanIMTPlus.verifyProof(membership, hashes)) // true

// Export the full tree state to a JSON string.
const data = tree.export()

// Import it back. By default the import validates that every commitment
// recomputed from the leaf records matches the serialized node hashes.
const tree2 = LeanIMTPlus.import(hashes, data)
```
