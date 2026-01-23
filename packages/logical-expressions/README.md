<p align="center">
    <h1 align="center">
        Logical Expressions
    </h1>
    <p align="center">A library to evaluate logical expressions.</p>
</p>

<p align="center">
    <a href="https://github.com/zk-kit/zk-kit">
        <img src="https://img.shields.io/badge/project-zk--kit-blue.svg?style=flat-square">
    </a>
    <a href="https://github.com/zk-kit/zk-kit/tree/main/packages/logical-expressions/LICENSE">
        <img alt="NPM license" src="https://img.shields.io/npm/l/%40zk-kit%2Flogical-expressions?style=flat-square">
    </a>
    <a href="https://www.npmjs.com/package/@zk-kit/logical-expressions">
        <img alt="NPM version" src="https://img.shields.io/npm/v/@zk-kit/logical-expressions?style=flat-square" />
    </a>
    <a href="https://npmjs.org/package/@zk-kit/logical-expressions">
        <img alt="Downloads" src="https://img.shields.io/npm/dm/@zk-kit/logical-expressions.svg?style=flat-square" />
    </a>
    <a href="https://bundlephobia.com/package/@zk-kit/logical-expressions">
        <img alt="npm bundle size (scoped)" src="https://img.shields.io/bundlephobia/minzip/@zk-kit/logical-expressions" />
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

| This library facilitates the work with logical (boolean) expressions. It allows you to tokenize and evaluate any logical expression. It supports the use of parentheses. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |

## 🛠 Install

### npm or yarn

Install the `@zk-kit/logical-expressions` package with npm:

```bash
npm i @zk-kit/logical-expressions
```

or yarn:

```bash
yarn add @zk-kit/logical-expressions
```

### CDN

You can also load it using a `script` tag using [unpkg](https://unpkg.com/):

```html
<script src="https://unpkg.com/@zk-kit/logical-expressions"></script>
```

or [JSDelivr](https://www.jsdelivr.com/):

```html
<script src="https://cdn.jsdelivr.net/npm/@zk-kit/logical-expressions"></script>
```

## 📜 Usage

Supported logical operators: `and`, `or`, `not`, `xor`.

All other existing logical operators (`nand`, `nor`, `xnor`) can be generated using the supported logical operators.

## Tokenize a logical expression

\# **tokenize**(): _string[]_

Tokenizes a logical (boolean) expression.
Splits the expression into meaningful tokens.

```ts
import { tokenize } from "@zk-kit/logical-expressions"

const expression = "true and false or ( true and true )"

const tokens = tokenize(expression)

console.log(tokens)
// Output: ["true", "and", "false", "or", "(", "true", "and", "true", ")"]
```

## Precedence of a logical operator

\# **precedence**(): _number_

Returns the precedence of a logical operator. If the operator is not supported, the precedence will be 0.

```ts
import { precedence } from "@zk-kit/logical-expressions"

const result = precedence("and")

console.log(result) // Output: 1
```

## Apply Operator

\# **applyOperator**(): _boolean_

Applies unary or binary operators to boolean values.

```ts
import { applyOperator } from "@zk-kit/logical-expressions"

// Unary operator
const result1 = applyOperator("not", true)
console.log(result1) // Output: false

// Binary operator
const result2 = applyOperator("and", true, false)
console.log(result2) // Output: false
```

## Evaluate a tokenized logical expression

\# **evaluate**(): _boolean_

Evaluates a tokenized logical (boolean) expression.

There is no need to verify the correctness of the logical expression before calling the evaluate function, as this will be checked during the evaluation. If the expression is incorrect, an error will be thrown automatically.

Example of correct logical expression: `"true and false"`.

Example of incorrect logical expression: `"true true and false"`.

```ts
import { evaluate } from "@zk-kit/logical-expressions"

const expression = ["true", "and", "false"]

const result = evaluate(expression)

console.log(result) // Output: false
```
