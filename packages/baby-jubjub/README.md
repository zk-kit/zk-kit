<p align="center">
    <h1 align="center">
        Baby Jubjub
    </h1>
    <p align="center">A JavaScript library for adding points to the Baby Jubjub curve.</p>
</p>

<p align="center">
    <a href="https://github.com/zk-kit/zk-kit">
        <img src="https://img.shields.io/badge/project-zk--kit-blue.svg?style=flat-square">
    </a>
    <a href="https://github.com/zk-kit/zk-kit/tree/main/packages/baby-jubjub/LICENSE">
        <img alt="NPM license" src="https://img.shields.io/npm/l/%40zk-kit%2Fbaby-jubjub?style=flat-square">
    </a>
    <a href="https://www.npmjs.com/package/@zk-kit/baby-jubjub">
        <img alt="NPM version" src="https://img.shields.io/npm/v/@zk-kit/baby-jubjub?style=flat-square" />
    </a>
    <a href="https://npmjs.org/package/@zk-kit/baby-jubjub">
        <img alt="Downloads" src="https://img.shields.io/npm/dm/@zk-kit/baby-jubjub.svg?style=flat-square" />
    </a>
    <a href="https://bundlephobia.com/package/@zk-kit/baby-jubjub">
        <img alt="npm bundle size (scoped)" src="https://img.shields.io/bundlephobia/minzip/@zk-kit/baby-jubjub" />
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

BabyJubJub is an elliptic curve optimized for secure, efficient cryptographic operations in constrained environments like blockchain and zero-knowledge proofs. It's designed for fast, privacy-preserving transactions, balancing cryptographic strength with performance, making it ideal for modern cryptographic solutions.

## References

1. Barry WhiteHat, Marta Bellés, Jordi Baylina. _ERC-2494: Baby Jubjub Elliptic Curve_. 2020-01-29. https://eips.ethereum.org/EIPS/eip-2494.
2. Barry WhiteHat, Marta Bellés, Jordi Baylina. _Baby Jubjub Elliptic Curve_. https://docs.iden3.io/publications/pdfs/Baby-Jubjub.pdf

---

## 🛠 Install

### npm or yarn

Install the `@zk-kit/baby-jubjub` package and its peer dependencies with npm:

```bash
npm i @zk-kit/baby-jubjub
```

or yarn:

```bash
yarn add @zk-kit/baby-jubjub
```

### CDN

You can also load it using a `script` tag using [unpkg](https://unpkg.com/):

```html
<script src="https://unpkg.com/@zk-kit/baby-jubjub"></script>
```

or [JSDelivr](https://www.jsdelivr.com/):

```html
<script src="https://cdn.jsdelivr.net/npm/@zk-kit/baby-jubjub"></script>
```

## 📜 Usage

```typescript
import { packPoint, unpackPoint, Base8, mulPointEscalar, Point, addPoint } from "@zk-kit/baby-jubjub"

// Define two points on the BabyJubJub curve.
const p1: Point<bigint> = [BigInt(0), BigInt(1)] // Point at infinity (neutral element).
const p2: Point<bigint> = [BigInt(1), BigInt(0)] // Example point.

// Add the two points on the curve.
const p3 = addPoint(p1, p2)

// Add the result with Base8, another point on the curve, to get a new point.
const secretScalar = addPoint(Base8, p3)

// Multiply the base point by the x-coordinate of the secret scalar to get the public key.
const publicKey = mulPointEscalar(Base8, secretScalar[0])

// Pack the public key into a compressed format.
const packedPoint = packPoint(publicKey)

// Unpack the compressed public key back into its original form.
const unpackedPoint = unpackPoint(packedPoint)

if (unpackedPoint) {
    console.log(publicKey[0] === unpackedPoint[0]) // true, checks if x-coordinates match
    console.log(publicKey[1] === unpackedPoint[1]) // true, checks if y-coordinates match
}
```
