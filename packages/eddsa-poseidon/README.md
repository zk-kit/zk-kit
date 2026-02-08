<p align="center">
    <h1 align="center">
        EdDSA Poseidon
    </h1>
    <p align="center">A JavaScript EdDSA library for secure signing and verification using Poseidon and the Baby Jubjub elliptic curve.</p>
</p>

<p align="center">
    <a href="https://github.com/zk-kit/zk-kit">
        <img src="https://img.shields.io/badge/project-zk--kit-blue.svg?style=flat-square">
    </a>
    <a href="https://github.com/zk-kit/zk-kit/tree/main/packages/eddsa-poseidon/LICENSE">
        <img alt="NPM license" src="https://img.shields.io/npm/l/%40zk-kit%2Feddsa-poseidon?style=flat-square">
    </a>
    <a href="https://www.npmjs.com/package/@zk-kit/eddsa-poseidon">
        <img alt="NPM version" src="https://img.shields.io/npm/v/@zk-kit/eddsa-poseidon?style=flat-square" />
    </a>
    <a href="https://npmjs.org/package/@zk-kit/eddsa-poseidon">
        <img alt="Downloads" src="https://img.shields.io/npm/dm/@zk-kit/eddsa-poseidon.svg?style=flat-square" />
    </a>
    <a href="https://bundlephobia.com/package/@zk-kit/eddsa-poseidon">
        <img alt="npm bundle size (scoped)" src="https://img.shields.io/bundlephobia/minzip/@zk-kit/eddsa-poseidon" />
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

| This package offers a simplified JavaScript codebase essential for creating and validating digital signatures using EdDSA and Poseidon. It's built upon the Baby Jubjub elliptic curve, ensuring seamless integration with [Circom](https://github.com/iden3/circom) and enhancing the developer experience. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |

> [!NOTE]  
> This library has been audited as part of the Semaphore V4 PSE audit: https://semaphore.pse.dev/Semaphore_4.0.0_Audit.pdf.

-   Super lightweight: [**~33kB**](https://bundlephobia.com/package/@zk-kit/eddsa-poseidon) (minified)
-   Compatible with browsers and NodeJS
-   TS type support
-   Comprehensive code documentation
-   Full test coverage

👾 Would you like to try it now? Explore it now on [Ceditor](https://ceditor.cedoor.dev/52787e4ad57d2f2076648d509efc3448)!

## References

1. Barry WhiteHat, Marta Bellés, Jordi Baylina. _ERC-2494: Baby Jubjub Elliptic Curve_. 2020-01-29. https://eips.ethereum.org/EIPS/eip-2494.
2. Lorenzo Grassi, Dmitry Khovratovich, Christian Rechberger, Arnab Roy, and Markus Schofnegger. _POSEIDON: A New Hash Function for Zero-Knowledge Proof Systems_. 2019. https://eprint.iacr.org/2019/458.pdf.

## 🛠 Install

### npm or yarn

Install the `@zk-kit/eddsa-poseidon` package and its peer dependencies with npm:

```bash
npm i @zk-kit/eddsa-poseidon
```

or yarn:

```bash
yarn add @zk-kit/eddsa-poseidon
```

### CDN

You can also load it using a `script` tag using [unpkg](https://unpkg.com/):

```html
<script src="https://unpkg.com/@zk-kit/eddsa-poseidon"></script>
```

or [JSDelivr](https://www.jsdelivr.com/):

```html
<script src="https://cdn.jsdelivr.net/npm/@zk-kit/eddsa-poseidon"></script>
```

## 📜 Usage

The public key is generated using [BLAKE](<https://en.wikipedia.org/wiki/BLAKE_(hash_function)>) by default and BLAKE2 if specified in the import as follows: `import { ... } from "@zk-kit/eddsa-poseidon/blake-2b"`.

```typescript
import {
    derivePublicKey,
    signMessage,
    verifySignature,
    deriveSecretScalar,
    packPublicKey,
    unpackPublicKey
} from "@zk-kit/eddsa-poseidon"

// Your private key (secret).
const privateKey = "secret"
// The message you want to sign.
const message = "message"

// Derive a public key from the private key.
const publicKey = derivePublicKey(privateKey)

/*
[
    17191193026255111087474416516591393721975640005415762645730433950079177536248n,
    13751717961795090314625781035919035073474308127816403910435238282697898234143n
]
*/
console.log(publicKey)

// Sign the message.
const signature = signMessage(privateKey, message)

/*
{    
    R8: [
        12949573675545142400102669657964360005184873166024880859462384824349649539693n,
        18253636630408169174294927826710424418689461166073329946402765380454102840608n
    ],
    S: 701803947557694254685424075312408605924670918868054593580245088593184746870n
}
*/
console.log(signature)

const response = verifySignature(message, signature, publicKey)

// true.
console.log(response)

// Use this value as the input for your Circom circuit.
const secretScalar = deriveSecretScalar(privateKey)

/* 
6544992227624943856419766050818315045047569225455760139072025985369615672473
14277921624107172450683599157880963081763136590946434672207840996093731170206
*/
console.log(secretScalar)

// Pack the public key into a compressed format.
const packedPublicKey = packPublicKey(publicKey)

// 52359937820999550851358128406546520360380553803646081112576207882956925379784n
console.log(packedPublicKey)

// Unpack the compressed public key back into its original form.
const unpackedPublicKey = unpackPublicKey(packedPublicKey)

/*
[
    17191193026255111087474416516591393721975640005415762645730433950079177536248n,
    13751717961795090314625781035919035073474308127816403910435238282697898234143n
]
*/
console.log(unpackedPublicKey)

if (unpackedPublicKey) {
    console.log(publicKey[0] === unpackedPublicKey[0]) // true
    console.log(publicKey[1] === unpackedPublicKey[1]) // true
}
```
