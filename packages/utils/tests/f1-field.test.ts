import { F1Field } from "../src"

describe("F1Field", () => {
    let field: F1Field

    beforeEach(() => {
        field = new F1Field(13n)
    })

    it("Should create a finite field with a specific order", () => {
        expect(field.one).toBe(1n)
        expect(field.zero).toBe(0n)
        expect(field._order).toBe(13n)
        expect(field._half).toBe(13n >> 1n)
        expect(field._negone).toBe(13n - 1n)
    })

    it("Should map the value back into the finite field", () => {
        const a = field.e(26n)
        const b = field.e(-2n)
        const c = field.e(-15n)

        expect(a).toBe(0n)
        expect(b).toBe(11n)
        expect(c).toBe(11n)
    })

    it("Should add two values in the finite field", () => {
        const a = field.e(2n)
        const b = field.e(20n)
        const c = field.e(13n)

        expect(field.add(a, a)).toBe(4n)
        expect(field.add(b, a)).toBe(9n)
        expect(field.add(c, c)).toBe(0n)
    })

    it("Should subtract two values in the finite field", () => {
        const a = field.e(4n)
        const b = field.e(2n)

        expect(field.sub(a, b)).toBe(2n)
        expect(field.sub(b, a)).toBe(11n)
    })

    it("Should multiply two values in the finite field", () => {
        const a = field.e(2n)
        const b = field.e(11n)

        expect(field.mul(a, a)).toBe(4n)
        expect(field.mul(a, b)).toBe(9n)
    })

    it("Should divide two values in the finite field", () => {
        const a = field.e(2n)
        const b = field.e(4n)

        expect(field.div(a, b)).toBe(7n)
    })

    it("Should check equality of two values in the finite field", () => {
        const a = field.e(2n)
        const b = field.e(3n)

        expect(field.eq(a, a)).toBeTruthy()
        expect(field.eq(a, b)).toBeFalsy()
    })

    it("Should square a value in the finite field", () => {
        const a = field.e(2n)
        const b = field.e(5n)

        expect(field.square(a)).toBe(4n)
        expect(field.square(b)).toBe(12n)
    })

    it("Should compute the inverse of a value in the finite field", () => {
        const a = field.e(2n)
        const b = field.e(11n)

        expect(field.inv(a)).toBe(7n)
        expect(field.inv(b)).toBe(6n)
    })

    it("Should throw an error if inv input is 0", () => {
        expect(() => field.inv(0n)).toThrow("Zero has no inverse")
    })

    it("Should compare two values with less-than in the finite field", () => {
        const a = field.e(2n)
        const b = field.e(3n)

        expect(field.lt(a, b)).toBeTruthy()
        expect(field.lt(a, b)).toBeTruthy()
        expect(field.lt(b, a)).toBeFalsy()
    })

    it("Should compare two values with greater-or-equal in the finite field", () => {
        const a = field.e(2n)
        const b = field.e(3n)

        expect(field.geq(a, b)).toBeFalsy()
        expect(field.geq(b, a)).toBeTruthy()
    })

    it("Should negate a value in the finite field", () => {
        const a = field.e(2n)
        const b = field.e(-3n)

        expect(field.neg(a)).toBe(11n)
        expect(field.neg(b)).toBe(3n)
    })

    it("Should check if a value is zero in the finite field", () => {
        const a = field.e(0n)
        const b = field.e(1n)

        expect(field.isZero(a)).toBeTruthy()
        expect(field.isZero(b)).toBeFalsy()
    })

    it("Should exponentiate a value in the finite field", () => {
        const a = field.e(0n)
        const b = field.e(1n)
        const c = field.e(2n)
        const d = field.e(3n)

        expect(field.pow(b, a)).toBe(1n)
        expect(field.pow(b, c)).toBe(1n)
        expect(field.pow(c, d)).toBe(8n)
        expect(field.pow(c, -1n)).toBe(field.inv(c))
        expect(field.pow(d, -30n)).toBe(1n)
    })
})
