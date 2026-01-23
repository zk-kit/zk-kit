<p align="center">
    <h1 align="center">
        LazyTower
    </h1>
    <p align="center">LazyTower implementation in TypeScript.</p>
</p>

<p align="center">
    <a href="https://github.com/zk-kit/zk-kit">
        <img src="https://img.shields.io/badge/project-zk--kit-blue.svg?style=flat-square">
    </a>
    <a href="https://github.com/zk-kit/zk-kit/tree/main/packages/lazytower/LICENSE">
        <img alt="NPM license" src="https://img.shields.io/npm/l/%40zk-kit%2Flazytower?style=flat-square">
    </a>
    <a href="https://www.npmjs.com/package/@zk-kit/lazytower">
        <img alt="NPM version" src="https://img.shields.io/npm/v/@zk-kit/lazytower?style=flat-square" />
    </a>
    <a href="https://npmjs.org/package/@zk-kit/lazytower">
        <img alt="Downloads" src="https://img.shields.io/npm/dm/@zk-kit/lazytower.svg?style=flat-square" />
    </a>
    <a href="https://bundlephobia.com/package/@zk-kit/lazytower">
        <img alt="npm bundle size (scoped)" src="https://img.shields.io/bundlephobia/minzip/@zk-kit/lazytower" />
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
        <span>&nbsp;&nbsp;|&nbsp;&nbsp;</span>
        <a href="https://zkkit.appliedzkp.org/lazytower">
            📘 Docs
        </a>
    </h4>
</div>

---

## ❗ WARNING

This library has not been audited.

## 🛠 Install

### npm or yarn

Install the `@zk-kit/lazytower` package with npm:

```bash
npm i @zk-kit/lazytower --save
```

or yarn:

```bash
yarn add @zk-kit/lazytower
```

### CDN

You can also load it using a `script` tag using [unpkg](https://unpkg.com/):

```html
<script src="https://unpkg.com/@zk-kit/lazytower/"></script>
```

or [JSDelivr](https://www.jsdelivr.com/):

```html
<script src="https://cdn.jsdelivr.net/npm/@zk-kit/lazytower/"></script>
```

## 📜 Usage

```typescript
import { LazyTowerHashChainProofBuilder } from "@zk-kit/lazytower"
import { poseidon } from "circomlibjs" // v0.0.8

const H = 10
const W = 4
const pb = LazyTowerHashChainProofBuilder(H, W, poseidon)
for (let i = BigInt(0); i < 150; i += BigInt(1)) {
    pb.add(i)
}
const index = pb.indexOf(BigInt(42))
const proof = pb.build(index)
console.log(proof)
```

## Contacts

### Developers

-   e-mail : lcamel@gmail.com
-   github : [@LCamel](https://github.com/LCamel)
-   website : https://www.facebook.com/LCamel
