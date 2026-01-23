<p align="center">
    <h1 align="center">
        Poseidon Cipher
    </h1>
    <p align="center">Poseidon Hash function Encryption and Decryption implementation in TypeScript.</p>
</p>

<p align="center">
    <a href="https://github.com/zk-kit/zk-kit">
        <img src="https://img.shields.io/badge/project-zk--kit-blue.svg?style=flat-square">
    </a>
    <a href="https://github.com/zk-kit/zk-kit/tree/main/packages/poseidon-cipher/LICENSE">
        <img alt="NPM license" src="https://img.shields.io/npm/l/%40zk-kit%2Fposeidon-cipher?style=flat-square">
    </a>
    <a href="https://www.npmjs.com/package/@zk-kit/poseidon-cipher">
        <img alt="NPM version" src="https://img.shields.io/npm/v/@zk-kit/poseidon-cipher?style=flat-square" />
    </a>
    <a href="https://npmjs.org/package/@zk-kit/poseidon-cipher">
        <img alt="Downloads" src="https://img.shields.io/npm/dm/@zk-kit/poseidon-cipher.svg?style=flat-square" />
    </a>
    <a href="https://bundlephobia.com/package/@zk-kit/poseidon-cipher">
        <img alt="npm bundle size (scoped)" src="https://img.shields.io/bundlephobia/minzip/@zk-kit/poseidon-cipher" />
    </a>
    <a href="https://eslint.org/">
        <img alt="Linter eslint" src="https://img.shields.io/badge/linter-eslint-8080f2?style=flat-square&logo=eslint" />
    </a>
    <a href="https://prettier.io/">
        <img alt="Code style prettier" src="https://img.shields.io/badge/code%20style-prettier-f8bc45?style=flat-square&logo=prettier" />
    </a>
</p>

> ⚠️ **SECURITY WARNING**: This implementation uses JavaScript's native `BigInt` which is [not constant-time](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt#cryptography) and may be vulnerable to timing attacks. If your application requires protection against timing attacks, consider using a constant-time cryptographic library instead. This issue is tracked in [GitHub issue #341](https://github.com/zk-kit/zk-kit/issues/341).

<div align="center">
    <h4>
        <a href="https://appliedzkp.org/discord">
            🗣️ Chat &amp; Support
        </a>
    </h4>
</div>

This package implements encryption and decryption using the Poseidon hash function. This is a rewrite of the [original implementation](https://github.com/weijiekoh/circomlib/tree/feat/poseidon-encryption/src).

## References

1. Dmitry Khovratovich. _Encryption with Poseidon_. 2019-12-26. https://drive.google.com/file/d/1EVrP3DzoGbmzkRmYnyEDcIQcXVU7GlOd/view.

---

## 🛠 Install

### npm or yarn

You can install `@zk-kit/poseidon-cipher` package with npm:

```bash
npm i @zk-kit/poseidon-cipher --save
```

or yarn:

```bash
yarn add @zk-kit/poseidon-cipher
```

### CDN

You can also load it using a `script` tag using [unpkg](https://unpkg.com/):

```html
<script src="https://unpkg.com/@zk-kit/poseidon-cipher"></script>
```

or [JSDelivr](https://www.jsdelivr.com/):

```html
<script src="https://cdn.jsdelivr.net/npm/@zk-kit/poseidon-cipher"></script>
```

## 📜 Usage

```typescript
import { poseidonEncrypt, poseidonDecrypt, poseidonDecryptWithoutCheck } from "@zk-kit/poseidon-cipher"

// BabyJubJub random value used as private key.
const privateKey = BigInt("10108149867830299554549347844489388280570828384194562713227904027271736843407")

console.log(privateKey)

// The BabyJubJub public key derived from the private key.
const publicKey = [
    BigInt("15100511232447817691325643662379962541629809665246870882117771367990737816375"),
    BigInt("16289853525630400225782441139722681929418024277641315637394850958390724375621")
]
/**
[
    15100511232447817691325643662379962541629809665246870882117771367990737816375n,
    16289853525630400225782441139722681929418024277641315637394850958390724375621n
]
 */
console.log(publicKey)

/**
 * The Elliptic-Curve Diffie–Hellman (ECDH) shared key from the private and public key.
 * Learn more at https://en.wikipedia.org/wiki/Elliptic-curve_Diffie%E2%80%93Hellman.
 */
const encryptionKey = [
    BigInt("18215233274609902892566361706948385597370728108990013889912246034099844508236"),
    BigInt("14884395706232754242497822954958766875005771827082919466711779658153477561231")
]
/**
[
    18215233274609902892566361706948385597370728108990013889912246034099844508236n,
    14884395706232754242497822954958766875005771827082919466711779658153477561231n
]
 */
console.log(encryptionKey)

// The plaintext to be encrypted.
const plainText = [BigInt(0), BigInt(1)]
// The unique random value.
const nonce = BigInt(5)

// Compute the encryption.
const encrypted = poseidonEncrypt(plainText, encryptionKey, nonce)
/*
[
  13027563531333274777964504528445510545245985419061604793949748860800093661040n,
  21542829407417339379457427303368865281142518080970543920113508599380643597111n,
  334052772696549592017166610161467257195783602071397160212931200489386609812n,
  9075054520224362422769554641603717496449971372103870041485347221024944155182n
]
 */
console.log(encrypted)

// Compute the decryption.
const decrypted = poseidonDecrypt(encrypted, encryptionKey, nonce, plainText.length)
/*
[
    0n,
    1n
]
 */
console.log(decrypted)

// Compute the decryption without check.
const decryptedWithoutCheck = poseidonDecryptWithoutCheck(encrypted, encryptionKey, nonce, plainText.length)
/*
[
    0n,
    1n
]
 */
console.log(decryptedWithoutCheck)
```
