import { scalar } from "../src"

describe("scalar", () => {
    it("Should return true for scalar isZero when value is zero", async () => {
        expect(scalar.isZero(BigInt(0))).toBeTruthy()
        expect(scalar.isZero(BigInt(1))).toBeFalsy()
    })

    it("Should return true for scalar isOdd when value is odd", async () => {
        expect(scalar.isOdd(BigInt(1))).toBeTruthy()
        expect(scalar.isOdd(BigInt(0))).toBeFalsy()
    })

    it("Should shift a scalar value right by the given number of bits", async () => {
        expect(scalar.shiftRight(BigInt(0), BigInt(1))).toBe(BigInt(0))
        expect(scalar.shiftRight(BigInt(1), BigInt(0))).toBe(BigInt(1))
    })

    it("Should multiply two scalar values", async () => {
        expect(scalar.mul(BigInt(0), BigInt(1))).toBe(BigInt(0))
        expect(scalar.mul(BigInt(1), BigInt(0))).toBe(BigInt(0))
        expect(scalar.mul(BigInt(1), BigInt(1))).toBe(BigInt(1))
        expect(scalar.mul(BigInt(1), BigInt(2))).toBe(BigInt(2))
        expect(scalar.mul(BigInt(2), BigInt(1))).toBe(BigInt(2))
        expect(scalar.mul(BigInt(3), BigInt(4))).toBe(BigInt(12))
    })

    it("Should return true for scalar gt when first value is greater", async () => {
        expect(scalar.gt(BigInt(0), BigInt(1))).toBeFalsy()
        expect(scalar.gt(BigInt(1), BigInt(0))).toBeTruthy()
    })

    it("Should return the bit representation of a scalar value", async () => {
        expect(scalar.bits(BigInt(0))).toStrictEqual([])
        expect(scalar.bits(BigInt(1))).toStrictEqual([1])
        expect(scalar.bits(BigInt(2))).toStrictEqual([0, 1])
    })
})
