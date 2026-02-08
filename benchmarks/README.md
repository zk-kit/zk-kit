# ZK-Kit: Merkle Tree Benchmarks

This project is part of the `zk-kit` repository and includes benchmarking tests for three Merkle Tree implementations:

-   **Incremental Merkle Tree (IMT)** from `@zk-kit/imt`
-   **Lean Incremental Merkle Tree (LeanIMT)** from `@zk-kit/lean-imt`
-   **Sparse Merkle Tree (SMT)** from `@zk-kit/smt`

The benchmark compares the performance of each Merkle Tree implementation for operations like adding leaves, generating proofs, and verifying proofs.

## Table of Contents

-   [Installation](#installation)
-   [Usage](#usage)
-   [Benchmark](#benchmark)
-   [Results](#results)
-   [Dependencies](#dependencies)

---

## Installation

Before running the benchmark, ensure that you have Node.js version 20 installed and the required dependencies set up.

1. **Clone the Repository**:
    ```bash
    git clone https://github.com/zk-kit/zk-kit.git
    cd zk-kit
    yarn
    ```

## Usage

To run the benchmark, use the following script:

```bash
yarn run benchmarks
```

## Benchmark

The benchmark includes the following tests for each Merkle Tree implementation:

1. Add Leaves: Measures the time it takes to insert a number of leaves into the tree.
2. Generate Proofs: Measures the performance of generating Merkle proofs.
3. Verify Proofs: Measures how quickly the generated proofs can be verified.
4. Update Leaves: Measures how quickly the leaves can be updated.
5. Delete Leaves: Measures how quickly the leaves can be deleted. The Lean Merkle tree is excluded because it does not have deleted method implemented.

## Benchmark Structure.

-   The benchmarks are defined using the [benny](https://caderek.github.io/benny/) library.
-   Results are saved to .html files in the benchmarks/results directory for visualization and further analysis.

## Results

The results for the benchmarking process will be saved in the following formats:

Charts: Performance charts for each operation are saved as .html files.
Tables: Detailed benchmark results in tabular form are also saved.
Results can be found in the benchmarks/results directory after running the benchmark.

## Example of Benchmark Execution

Here’s a typical output from running the benchmark:

```bash

Suite: add-merkle-trees-1000
IMT - Add 1000 leaves x 12,345 ops/sec ±2.31% (92 runs sampled)
LeanIMT - Add 1000 leaves x 9,876 ops/sec ±1.87% (87 runs sampled)
SparseMT - Add 1000 leaves x 7,654 ops/sec ±3.14% (75 runs sampled)
Fastest is IMT - Add 1000 leaves

Suite: proof-generation-merkle-trees-1000
IMT - Generated 500 proofs x 4,321 ops/sec ±2.02% (80 runs sampled)
LeanIMT - Generated 500 proofs x 3,456 ops/sec ±1.75% (78 runs sampled)
SparseMT - Generated 500 proofs x 2,789 ops/sec ±2.63% (68 runs sampled)
Fastest is IMT - Generated 500 proofs
```

The Benchmarks suggested in the index.ts are for **8, 128 and 1024 leaves** to see how each Merkle tree for different sizes of trees
perform because their theoretical expected behavior described [here](https://github.com/zk-kit/zk-kit?tab=readme-ov-file#i-need-to-use-a-merkle-tree-to-prove-the-inclusion-or-exclusion-of-data-elements-within-a-set-which-type-of-merkle-tree-should-i-use).

## Dependencies

This benchmark depends on the following packages:

-   @zk-kit/imt: Incremental Merkle Tree implementation.
-   @zk-kit/lean-imt: Lean Incremental Merkle Tree implementation.
-   @zk-kit/smt: Sparse Merkle Tree implementation.
-   benny: A benchmark library for testing performance.
-   ts-node: TypeScript execution environment for Node.js.
-   winston: Logger used for capturing errors and logs during execution.

## Notes

-   Node.js Version: The benchmarks are tested and run with Node.js version 20. Ensure you have the correct version installed.
-   Logging: Logs, including any errors that occur during benchmarking, are captured using the winston logger and saved to error.log in the root directory.
