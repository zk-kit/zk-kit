<p align="center">
    <h1 align="center">
        Lean Incremental Merkle Tree
    </h1>
    <p align="center">Lean Incremental Merkle tree implementation in TypeScript.</p>
</p>

<p align="center">
    <a href="https://github.com/zk-kit/zk-kit">
        <img src="https://img.shields.io/badge/project-zk--kit-blue.svg?style=flat-square">
    </a>
    <a href="https://github.com/zk-kit/zk-kit/tree/main/packages/lean-imt/LICENSE">
        <img alt="NPM license" src="https://img.shields.io/npm/l/%40zk-kit%2Flean-imt?style=flat-square">
    </a>
    <a href="https://www.npmjs.com/package/@zk-kit/lean-imt">
        <img alt="NPM version" src="https://img.shields.io/npm/v/@zk-kit/lean-imt?style=flat-square" />
    </a>
    <a href="https://npmjs.org/package/@zk-kit/lean-imt">
        <img alt="Downloads" src="https://img.shields.io/npm/dm/@zk-kit/lean-imt.svg?style=flat-square" />
    </a>
    <a href="https://bundlephobia.com/package/@zk-kit/lean-imt">
        <img alt="npm bundle size (scoped)" src="https://img.shields.io/bundlephobia/minzip/@zk-kit/lean-imt" />
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

> [!NOTE]  
> This library has been audited as part of the Semaphore V4 PSE audit: https://semaphore.pse.dev/Semaphore_4.0.0_Audit.pdf.

The LeanIMT is an optimized binary version of the [IMT](https://github.com/zk-kit/zk-kit/tree/main/packages/imt) into binary-focused model, eliminating the need for zero values and allowing dynamic depth adjustment. Unlike the IMT, which uses a zero hash for incomplete nodes, the LeanIMT directly adopts the left child's value when a node lacks a right counterpart. The tree's depth dynamically adjusts to the count of leaves, enhancing efficiency by reducing the number of required hash calculations. To understand more about the LeanIMT, check out the [paper](https://github.com/zk-kit/zk-kit/tree/main/papers/leanimt).

---

## 🛠 Install

### npm or yarn

Install the `@zk-kit/lean-imt` package with npm:

```bash
npm i @zk-kit/lean-imt --save
```

or yarn:

```bash
yarn add @zk-kit/lean-imt
```

### CDN

You can also load it using a `script` tag using [unpkg](https://unpkg.com/):

```html
<script src="https://unpkg.com/@zk-kit/lean-imt"></script>
```

or [JSDelivr](https://www.jsdelivr.com/):

```html
<script src="https://cdn.jsdelivr.net/npm/@zk-kit/lean-imt"></script>
```

## 📜 Usage

```typescript
import { LeanIMT } from "@zk-kit/lean-imt"
import { poseidon2 } from "poseidon-lite"

// Hash function used to compute the tree nodes.
const hash = (a, b) => poseidon2([a, b])

// To create an instance of a LeanIMT, you must provide the hash function.
const tree = new LeanIMT(hash)

// You can also initialize a tree with a given list of leaves.
// const leaves = [1n, 2n, 3n]
// new LeanIMT(hash, leaves)

// LeanIMT is strictly typed. Default type for nodes is 'bigint',
// but you can set your own type.
// new LeanIMT<number>((a, b) => a + b)

// Insert (incrementally) a leaf with a value of 1.
tree.insert(1n)
// [1n]
console.log(tree.leaves)

// Insert (incrementally) a leaf with a value of 3.
tree.insert(3n)

// 21106761926285267690763443010820487107972411248208546226053195422384279971821n
console.log(tree.root)
// 1
console.log(tree.depth)
// 2
console.log(tree.size)
// [1n, 3n]
console.log(tree.leaves)

// Get the index of the leaf with value 3n.
const idx = tree.indexOf(3n)
// 1
console.log(idx)

// Check if the tree contains a leaf with value 4n.
const has = tree.has(4n)
// false
console.log(tree.has(4n))

// Update the value of the leaf at position 1 to 2n.
tree.update(1, 2n)
// [1n, 2n]
console.log(tree.leaves)

// If you want to delete a leaf with LeanIMT you can use the update function with an
// arbitrary value to be used for the removed leaves.
// Update the value of the leaf at position 1 to 0n (deletion).
tree.update(1, 0n)
// [1n, 0n]
console.log(tree.leaves)

// Compute a Merkle Inclusion Proof (proof of membership) for the leaf with index 1.
// The proof is only valid if the value 1 is found in a leaf of the tree.
const proof = tree.generateProof(1)
// true
console.log(tree.verifyProof(proof))

// Export all the tree nodes.
const nodes = tree.export()

// Import the nodes.
const tree2 = LeanIMT.import(hash, nodes)

// Node types are converted from strings to bigints by default.
// The third parameter can be used to convert strings to other types.

// Import the nodes converting their types to numbers.
const tree3 = LeanIMT.import<number>(hash, nodes, Number)
```
