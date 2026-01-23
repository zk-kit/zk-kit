import { r } from "@zk-kit/baby-jubjub"
import { poseidon } from "circomlibjs"
import { N_ROUNDS_P, two128 } from "../src/constants"
import { checkEqual, normalize, poseidonPerm, pow5, unstringifyBigInts, validateNonce } from "../src/utils"

describe("utils", () => {
    describe("poseidonPerm", () => {
        it("Should produce the same output as circomlibjs", () => {
            const inputs = [BigInt(1), BigInt(2), BigInt(3)]
            const outputCircomlib = poseidon(inputs)
            const outputSelf = poseidonPerm([BigInt(0), ...inputs])
            expect(outputSelf[0]).toStrictEqual(outputCircomlib)
        })
        it("Should produce deterministic output", () => {
            const inputs = [BigInt(1), BigInt(2), BigInt(3)]
            const output1 = poseidonPerm([BigInt(0), ...inputs])
            const output2 = poseidonPerm([BigInt(0), ...inputs])
            expect(output1).toStrictEqual(output2)
        })
        it("Should throw when given an empty array as input", () => {
            expect(() => poseidonPerm([])).toThrow("Input length must be positive")
        })
        it("Should throw when given an input array of length greater than N_ROUND_P", () => {
            expect(() => poseidonPerm(Array<bigint>(N_ROUNDS_P.length + 1)).fill(BigInt(0))).toThrow(
                "Input length too large"
            )
        })
    })

    describe("checkEqual", () => {
        it("Should throw an error if the values are not equal", () => {
            expect(() => checkEqual(BigInt(1), BigInt(2), "Error")).toThrow("Error")
        })
        it("Should not throw an error if the values are equal", () => {
            expect(() => checkEqual(BigInt(1), BigInt(1), "Error")).not.toThrow("Error")
        })
    })

    describe("validateNonce", () => {
        it("Should throw an error if the nonce is greater than 2^128", () => {
            expect(() => validateNonce(two128 + BigInt(1))).toThrow("The nonce must be less than 2 ^ 128")
        })
        it("Should not throw an error if the nonce is less than 2^128", () => {
            expect(() => validateNonce(two128 - BigInt(1))).not.toThrow("The nonce must be less than 2 ^ 128")
        })
    })

    describe("pow5", () => {
        it("Should return the fifth power of the input", () => {
            expect(pow5(BigInt(1))).toBe(BigInt(1))
            expect(pow5(BigInt(2))).toBe(BigInt(32))
            expect(pow5(BigInt(3))).toBe(BigInt(243))
            expect(pow5(BigInt(4))).toBe(BigInt(1024))
            expect(pow5(BigInt(5))).toBe(BigInt(3125))
        })
    })

    describe("normalize", () => {
        it("Should normalize a value into the field range", () => {
            expect(normalize(BigInt(-1))).toBe(BigInt(r - BigInt(1)))
            expect(normalize(BigInt(-r))).toBe(BigInt(r))
            expect(normalize(BigInt(0))).toBe(BigInt(0))
            expect(normalize(BigInt(1))).toBe(BigInt(1))
            expect(normalize(BigInt(r))).toBe(BigInt(0))
            expect(normalize(BigInt(r + BigInt(1)))).toBe(BigInt(1))
        })
    })

    describe("unstringifyBigInts", () => {
        it("Should convert a string input with decimal numbers", () => {
            expect(unstringifyBigInts("1")).toBe(BigInt(1))
        })
        it("Should convert a string input with a hex number", () => {
            expect(unstringifyBigInts("0xA")).toBe(BigInt(10))
        })
        it("Should convert a string[] input", () => {
            expect(unstringifyBigInts(["1", "2"])).toStrictEqual([BigInt(1), BigInt(2)])
        })
        it("Should convert a string[][] input", () => {
            expect(
                unstringifyBigInts([
                    ["1", "2"],
                    ["3", "4"]
                ])
            ).toStrictEqual([
                [BigInt(1), BigInt(2)],
                [BigInt(3), BigInt(4)]
            ])
        })
        it("Should convert a string[][][] input", () => {
            expect(
                unstringifyBigInts([
                    [
                        ["1", "2"],
                        ["3", "4"]
                    ],
                    [
                        ["5", "6"],
                        ["7", "8"]
                    ]
                ])
            ).toStrictEqual([
                [
                    [BigInt(1), BigInt(2)],
                    [BigInt(3), BigInt(4)]
                ],
                [
                    [BigInt(5), BigInt(6)],
                    [BigInt(7), BigInt(8)]
                ]
            ])
        })
        it("Should convert a { [key: string]: string } input", () => {
            expect(unstringifyBigInts({ a: "1", b: "2" })).toStrictEqual({ a: BigInt(1), b: BigInt(2) })
        })
        it("Should return null for a null input", () => {
            expect(unstringifyBigInts(null)).toBeNull()
        })
        it("Should return the input unchanged if it is not a valid value", () => {
            expect(unstringifyBigInts("A")).toBe("A")
        })
    })
})
