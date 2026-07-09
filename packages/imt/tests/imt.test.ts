import { poseidon2, poseidon3, poseidon5 } from "poseidon-lite"
import { IncrementalQuinTree } from "incrementalquintree"
import { IMT, IMTNode } from "../src"

describe("IMT", () => {
    const depth = 16
    const numberOfLeaves = 9

    for (const arity of [2, 5]) {
        describe(`Arity = ${arity}`, () => {
            let poseidon: any
            let tree: IMT
            let oldTree: IncrementalQuinTree

            beforeEach(() => {
                poseidon = arity === 2 ? poseidon2 : poseidon5
                tree = new IMT(poseidon, depth, 0, arity)
                oldTree = new IncrementalQuinTree(depth, 0, arity, poseidon)
            })

            describe("# new IMT", () => {
                it("Should not initialize a tree with invalid parameters", () => {
                    const fun1 = () => new IMT(undefined as any, 33, 0, arity)
                    const fun2 = () => new IMT(1 as any, 33, 0, arity)
                    const fun3 = () => new IMT(poseidon, depth, 0, arity, 2 as any)

                    expect(fun1).toThrow("Parameter 'hash' is not a function, received type: undefined")
                    expect(fun2).toThrow("Parameter 'hash' is not a function, received type: number")
                    expect(fun3).toThrow("Parameter 'leaves' is not an object, received type: number")
                })

                it("Should not initialize a tree with a number of leaves > arity ** depth", () => {
                    const leaves = Array.from(Array(100).keys())

                    const fun = () => new IMT(poseidon, 2, 0, arity, leaves)

                    expect(fun).toThrow(`The tree cannot contain more than ${arity ** 2} leaves`)
                })

                it("Should initialize a tree", () => {
                    expect(tree.depth).toEqual(depth)
                    expect(tree.leaves).toHaveLength(0)
                    expect(tree.zeroes).toHaveLength(depth)
                    expect(tree.arity).toEqual(arity)
                })

                for (let numberOfLeaves = 100; numberOfLeaves < 116; numberOfLeaves += 1) {
                    it(`Should initialize a tree with ${numberOfLeaves} leaves`, () => {
                        const leaves = Array.from(Array(numberOfLeaves).keys())

                        const tree = new IMT(poseidon, depth, 0, arity, leaves)

                        const tree2 = new IMT(poseidon, depth, 0, arity)

                        for (const leaf of leaves) {
                            tree2.insert(leaf)
                        }

                        expect(tree.depth).toEqual(depth)
                        expect(tree.leaves).toHaveLength(numberOfLeaves)
                        expect(tree.zeroes).toHaveLength(depth)
                        expect(tree.arity).toEqual(arity)
                        expect(tree.root).toEqual(tree2.root)
                    })
                }
            })

            describe("# insert", () => {
                it("Should not insert a leaf into a full tree", () => {
                    const fullTree = new IMT(poseidon3, 1, 0, 3)

                    fullTree.insert(0)
                    fullTree.insert(1)
                    fullTree.insert(2)

                    const fun = () => fullTree.insert(4)

                    expect(fun).toThrow("The tree is full")
                })

                it(`Should insert ${numberOfLeaves} leaves`, () => {
                    for (let i = 0; i < numberOfLeaves; i += 1) {
                        tree.insert(1)
                        oldTree.insert(1)

                        const { root } = oldTree.genMerklePath(0)

                        expect(tree.root).toEqual(root)
                        expect(tree.leaves).toHaveLength(i + 1)
                    }
                })
            })

            describe("# delete", () => {
                it("Should not delete a leaf that does not exist", () => {
                    const fun = () => tree.delete(0)

                    expect(fun).toThrow("The leaf does not exist in this tree")
                })

                it(`Should delete ${numberOfLeaves} leaves`, () => {
                    for (let i = 0; i < numberOfLeaves; i += 1) {
                        tree.insert(1)
                        oldTree.insert(1)
                    }

                    for (let i = 0; i < numberOfLeaves; i += 1) {
                        tree.delete(i)
                        oldTree.update(i, 0)

                        const { root } = oldTree.genMerklePath(0)

                        expect(tree.root).toEqual(root)
                    }
                })
            })

            describe("# update", () => {
                it(`Should update ${numberOfLeaves} leaves`, () => {
                    for (let i = 0; i < numberOfLeaves; i += 1) {
                        tree.insert(1)
                        oldTree.insert(1)
                    }

                    for (let i = 0; i < numberOfLeaves; i += 1) {
                        tree.update(i, 0)
                        oldTree.update(i, 0)

                        const { root } = oldTree.genMerklePath(0)

                        expect(tree.root).toEqual(root)
                    }
                })

                it(`Should not throw when updating a leaf with the same value`, () => {
                    for (let i = 0; i < numberOfLeaves; i += 1) {
                        tree.insert(1)
                        oldTree.insert(1)
                    }

                    const previousRoot = tree.root

                    for (let i = 0; i < numberOfLeaves; i += 1) {
                        tree.update(i, 1)
                        oldTree.update(i, 1)

                        const { root } = oldTree.genMerklePath(0)

                        expect(tree.root).toEqual(root)
                        expect(tree.root).toEqual(previousRoot)
                    }
                })
            })

            describe("# indexOf", () => {
                it("Should return the index of a leaf", () => {
                    tree.insert(1)
                    tree.insert(2)

                    const index = tree.indexOf(2)

                    expect(index).toBe(1)
                })
            })

            describe("# createProof/verifyProof", () => {
                it("Should not create a proof if the leaf does not exist", () => {
                    tree.insert(1)

                    const fun = () => tree.createProof(1)

                    expect(fun).toThrow("The leaf does not exist in this tree")
                })

                it("Should create and verify a valid proof", () => {
                    for (let i = 0; i < numberOfLeaves; i += 1) {
                        tree.insert(i + 1)
                    }

                    for (let i = 0; i < numberOfLeaves; i += 1) {
                        const proof = tree.createProof(i)
                        expect(proof.leafIndex).toEqual(i)
                        expect(proof.siblings).toHaveLength(depth)
                        expect(proof.pathIndices).toHaveLength(depth)
                        for (let j = 0; j < depth; j += 1) {
                            expect(proof.siblings[j]).toHaveLength(arity - 1)
                            const leafV = Math.floor(i / arity ** j) % arity
                            expect(proof.pathIndices[j]).toEqual(leafV)
                        }

                        expect(tree.verifyProof(proof)).toBeTruthy()
                        expect(IMT.verifyProof(proof, poseidon)).toBeTruthy()
                    }
                })

                it("Should reject a proof with incorrect hash function", () => {
                    for (let i = 0; i < numberOfLeaves; i += 1) {
                        tree.insert(i + 1)
                    }

                    const proof = tree.createProof(numberOfLeaves - 1)
                    function badHash(values: IMTNode[]): IMTNode {
                        return values.reduce((a, b) => BigInt(a) + BigInt(b), BigInt(0))
                    }
                    expect(IMT.verifyProof(proof, badHash)).toBeFalsy()
                })
            })
        })
    }
})
