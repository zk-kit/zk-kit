import { crypto } from "../src"

describe("crypto", () => {
    it("Should throw when size is zero", async () => {
        const fun = () => crypto.getRandomValues(0)

        expect(fun).toThrow("size 0 is too small, need at least 1")
    })
    it("Should return a random value of the specified size", async () => {
        const rv1 = crypto.getRandomValues(1)
        const rv2 = crypto.getRandomValues(2)
        const rv32 = crypto.getRandomValues(32)

        expect(rv1).toBeDefined()
        expect(rv2).toBeDefined()
        expect(rv32).toBeDefined()
        expect(rv1).toHaveLength(1)
        expect(rv2).toHaveLength(2)
        expect(rv32).toHaveLength(32)
    })
})
