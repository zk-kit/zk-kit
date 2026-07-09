import { getFirstCommonElements, getIndexOfLastNonZeroElement, hexToBin, keyToPath, checkHex } from "../src/utils"

describe("Utility functions", () => {
    describe("Convert SMT keys in 256-bit paths", () => {
        it("Should convert a key to an array of 256 bits", () => {
            const path = keyToPath("17")

            expect(path).toHaveLength(256)
            expect(path.every((b) => b === 0 || b === 1)).toBeTruthy()
        })

        it("Should create a path in the correct order", () => {
            const path = keyToPath("17")

            expect(path.slice(0, 5)).toEqual([1, 1, 1, 0, 1])
        })
    })

    describe("Get index of the last non-zero element", () => {
        it("Should return the index of the last non-zero element", () => {
            const index = getIndexOfLastNonZeroElement(["0", "17", "3", "0", "3", "0", "3", "2", "0", "0"])

            expect(index).toBe(7)
        })

        it("Should return -1 if all elements are zero", () => {
            const index = getIndexOfLastNonZeroElement(["0", "0", "0", "0"])

            expect(index).toBe(-1)
        })
    })

    describe("Get first matching elements", () => {
        it("Should return the first matching elements of two arrays", () => {
            const array1 = [1, 4, 3, 8, 2, 9]
            const array2 = [1, 4, 2, 7, 2]

            const matchingArray = getFirstCommonElements(array1, array2)

            expect(matchingArray).toEqual([1, 4])
        })

        it("Should return the smallest array if all its elements are the first elements of the other array", () => {
            const array1 = [1, 4, 3, 8, 2]
            const array2 = [1, 4, 3, 8, 2, 32, 23]

            const matchingArray = getFirstCommonElements(array1, array2)

            expect(matchingArray).toEqual(array1)
        })
    })

    describe("Check hexadecimal", () => {
        it("Should return true if the number is a hexadecimal", () => {
            expect(checkHex("be12")).toBeTruthy()
        })

        it("Should return false if the number is not a hexadecimal", () => {
            expect(checkHex("gbe12")).toBeFalsy()
        })
    })

    describe("Convert hexadecimal to binary", () => {
        it("Should convert a hexadecimal number to a binary number", () => {
            expect(hexToBin("12")).toBe("10010")
        })
    })
})
