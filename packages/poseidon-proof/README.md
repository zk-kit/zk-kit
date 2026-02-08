<p align="center">
    <h1 align="center">
        Poseidon proof
    </h1>
    <p align="center">A library to generate and verify Poseidon proofs.</p>
</p>

<p align="center">
    <a href="https://github.com/zk-kit/zk-kit">
        <img src="https://img.shields.io/badge/project-zk--kit-blue.svg?style=flat-square">
    </a>
    <a href="https://github.com/zk-kit/zk-kit/tree/main/packages/poseidon-proof/LICENSE">
        <img alt="NPM license" src="https://img.shields.io/npm/l/%40zk-kit%2Fposeidon-proof?style=flat-square">
    </a>
    <a href="https://www.npmjs.com/package/@zk-kit/poseidon-proof">
        <img alt="NPM version" src="https://img.shields.io/npm/v/@zk-kit/poseidon-proof?style=flat-square" />
    </a>
    <a href="https://npmjs.org/package/@zk-kit/poseidon-proof">
        <img alt="Downloads" src="https://img.shields.io/npm/dm/@zk-kit/poseidon-proof.svg?style=flat-square" />
    </a>
    <a href="https://bundlephobia.com/package/@zk-kit/poseidon-proof">
        <img alt="npm bundle size (scoped)" src="https://img.shields.io/bundlephobia/minzip/@zk-kit/poseidon-proof" />
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

| This zero-knowledge library facilitates the demonstration of having a Poseidon hash pre-image while keeping the pre-image value confidential. Additionally, it offers a mechanism to prevent the same proof from being reused. The circuit that forms the foundation of this library is accessible via this [link](https://github.com/zk-kit/zk-kit.circom/blob/main/packages/poseidon-proof/src/poseidon-proof.circom). |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |

Originally developed for integration with [Semaphore V4](https://github.com/semaphore-protocol/semaphore), this library also functions effectively as a standalone tool. Notable use cases in connection with Semaphore can be:

-   allowing a Semaphore user to prove that they possess the secret value associated with the identity commitment of their Semaphore identity,
-   unmasking the identity of zero-knowledge proofs earlier created using Semaphore.

The Snark artifacts (`.wasm` and `.zkey` files) can be specified or not in the `generate` function parameters and can possibly be downloaded using the following URLs:

-   https://snark-artifacts.pse.dev/poseidon/{version}/poseidon-{numberOfInputs}.wasm
-   https://snark-artifacts.pse.dev/poseidon/{version}/poseidon-{numberOfInputs}.zkey

> [!WARNING]  
> The Snark artifacts currently used to generate zero-knowledge proofs are the result of an insecure trusted setup, and the library has not yet been audited. Therefore, it is advised not to use it in production.

## 🛠 Install

### npm or yarn

Install the `@zk-kit/poseidon-proof` package:

```bash
npm i @zk-kit/poseidon-proof
```

or yarn:

```bash
yarn add @zk-kit/poseidon-proof
```

## 📜 Usage

```typescript
import { generate, verify } from "@zk-kit/poseidon-proof"

// A public value used to contextualize the cryptographic proof and calculate the nullifier.
const scope = "scope"
// The message (preimage) to prove (secret).
const messages = [1, 2]

// Generate the proof.
const fullProof = await generate(messages, scope)

/*
    nb. scope, digest and nullifier are always the same - proof is variable.
    {
        scope: '2',
        digest: '13713635907739611880977640264956372443229506353728466835599871320028961887800',
        nullifier: '4995263610384888704435371233168916617325583088652670186865584118891394144999',
        proof: [
            '4344680442683455359115899095464919042642166233886432616638435348359080260980',
            '20569010229031596977566212621532395450352277701036306316464269899598925981651',
            '19318221594436336163085169568471746851468100277321435282188061183430353155289',
            '13863222659316400652438453097923451250965656325472339120118358727133180331649',
            '2718553541880998786976126630362604850217726344847462841516918030540821216281',
            '11960084231774590415377471656397863783771599717615252119734899677642065267169',
            '10666072962579546268534775428261696356732715643486735369393626224913301307278',
            '4251217137130113647513155953595492143724626859298741948572817563032672674599'
        ]
    }
*/
console.log(fullProof)

// If not specified, the Snark artifacts are downloaded automatically.
// You can specify them as follows.

// const fullProof = await generate(message, scope, {
//     wasm: "<your-path>/poseidon-proof.wasm",
//     zkey: "<your-path>/poseidon-proof.zkey"
// })

// Verify the proof.
const response = await verify(fullProof)

// true.
console.log(response)

// Eventually you may want to check the nullifier.
```

## 📈 Benchmarks

Benchmarks were run on an Intel Core i7-1165G7, 16 GB RAM machine (with two inputs).

| Generate proof | Verify proof | Constraints |
| -------------- | ------------ | ----------- |
| `170ms`        | `12ms`       | `214`       |

```js
import { generate, verify } from "@zk-kit/poseidon-proof"

console.time("generate")

const proof = await generate([1, 2], "scope")

console.timeEnd("generate")

console.time("verify")

console.log(await verify(proof))

console.timeEnd("verify")
```
