<p align="center">
    <h1 align="center">
        Utils
    </h1>
    <p align="center">Essential zero-knowledge utility library for JavaScript developers.</p>
</p>

<p align="center">
    <a href="https://github.com/zk-kit/zk-kit">
        <img src="https://img.shields.io/badge/project-zk--kit-blue.svg?style=flat-square">
    </a>
    <a href="https://github.com/zk-kit/zk-kit/tree/main/packages/utils/LICENSE">
        <img alt="NPM license" src="https://img.shields.io/npm/l/%40zk-kit%2Futils?style=flat-square">
    </a>
    <a href="https://www.npmjs.com/package/@zk-kit/utils">
        <img alt="NPM version" src="https://img.shields.io/npm/v/@zk-kit/utils?style=flat-square" />
    </a>
    <a href="https://npmjs.org/package/@zk-kit/utils">
        <img alt="Downloads" src="https://img.shields.io/npm/dm/@zk-kit/utils.svg?style=flat-square" />
    </a>
    <a href="https://bundlephobia.com/package/@zk-kit/utils">
        <img alt="npm bundle size (scoped)" src="https://img.shields.io/bundlephobia/minzip/@zk-kit/utils" />
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

## 🛠 Install

### npm or yarn

Install the `@zk-kit/utils` package and its peer dependencies with npm:

```bash
npm i @zk-kit/utils
```

or yarn:

```bash
yarn add @zk-kit/utils
```

### CDN

You can also load it using a `script` tag using [unpkg](https://unpkg.com/):

```html
<script src="https://unpkg.com/@zk-kit/utils"></script>
```

or [JSDelivr](https://www.jsdelivr.com/):

```html
<script src="https://cdn.jsdelivr.net/npm/@zk-kit/utils"></script>
```

## 📜 Usage

```typescript
// You can import modules from the main bundle.
import { errorHandlers, typeChecks } from "@zk-kit/utils"

// Or by using conditional exports.
import { requireNumber } from "@zk-kit/utils/error-handlers"
import { isNumber } from "@zk-kit/utils/type-checks"
```
