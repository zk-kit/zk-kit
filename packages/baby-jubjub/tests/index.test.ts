import { babyjub } from "circomlibjs"
import { utils } from "ffjavascript"
import { Base8, Point, addPoint, inCurve, mulPointEscalar, packPoint, r, unpackPoint } from "../src"
import { tonelliShanks } from "../src/sqrt"

describe("BabyJubjub", () => {
    const secretScalar = BigInt(324)

    let publicKey: Point<bigint>

    it("Should add 1 point to the curve", async () => {
        const p1: Point<bigint> = [BigInt(0), BigInt(1)]

        const newPoint = addPoint(p1, Base8)
        const circomlibNewPoint = babyjub.addPoint(p1, Base8)

        expect(newPoint[0]).toBe(circomlibNewPoint[0])
        expect(newPoint[1]).toBe(circomlibNewPoint[1])
    })

    it("Should derive a public key from a secret scalar", async () => {
        publicKey = mulPointEscalar(Base8, secretScalar)

        const circomlibPublicKey = babyjub.mulPointEscalar(Base8, secretScalar)

        expect(publicKey[0]).toBe(circomlibPublicKey[0])
        expect(publicKey[1]).toBe(circomlibPublicKey[1])
    })

    it("Should check if a point is in the curve", async () => {
        expect(inCurve(publicKey)).toBeTruthy()
    })

    it("Should pack a point", async () => {
        const packedPoint = packPoint(publicKey)
        // As a bigint, we expect the packed point to be identical to the Y coordinate,
        // except for the 1 bit added to represent whether the X coordinate is negative or positive.
        // We strip off that extra bit and check this expectation below.
        const strippedPackedPoint = packedPoint & ~(BigInt(1) << BigInt(255))

        const expectedPackedPoint = babyjub.packPoint(publicKey)

        expect(strippedPackedPoint).toBe(publicKey[1])
        expect(packedPoint).toBe(utils.leBuff2int(expectedPackedPoint))
    })

    it("Should unpack a packed public key", async () => {
        const publicKey = mulPointEscalar(Base8, secretScalar)
        const packedPoint = packPoint(publicKey)
        const unpackedPoint = unpackPoint(packedPoint) as Point<bigint>

        expect(unpackedPoint).not.toBeNull()
        expect(unpackedPoint[0]).toBe(publicKey[0])
        expect(unpackedPoint[1]).toBe(publicKey[1])
    })

    it("Should unpack a packed public key with less bytes than 32", async () => {
        const publicKey: Point<bigint> = [
            BigInt("10207164244839265210731148792003399330071235260758262804307337735329782473514"),
            BigInt("4504034976288485670718230979254896078098063043333320048161019268102694534400")
        ]

        const packedPoint = packPoint(publicKey)
        const unpackedPoint = unpackPoint(packedPoint) as Point<bigint>

        expect(unpackedPoint).not.toBeNull()
        expect(unpackedPoint[0]).toBe(publicKey[0])
        expect(unpackedPoint[1]).toBe(publicKey[1])
    })

    it("Should not unpack a packed public key if the coordinate y of the public key is not in the curve", async () => {
        const publicKey: Point<bigint> = [
            BigInt("10207164244839265210731148792003399330071235260758262804307337735329782473514"),
            BigInt(r + BigInt(1))
        ]

        const packedPoint = packPoint(publicKey)

        expect(unpackPoint(packedPoint)).toBeNull()
    })

    it("Should not unpack a packed point whose coordinate y is equal to the field modulus", async () => {
        // y = r would decode to the same point as y = 0, which is on the curve
        expect(unpackPoint(BigInt(0))).not.toBeNull()
        expect(unpackPoint(r)).toBeNull()
        expect(unpackPoint(r | (BigInt(1) << BigInt(255)))).toBeNull()
    })

    it("Should not unpack a packed point with the sign bit set when x is zero", async () => {
        const identity: Point<bigint> = [BigInt(0), BigInt(1)]

        expect(unpackPoint(packPoint(identity))).toStrictEqual(identity)
        expect(unpackPoint(BigInt(1) | (BigInt(1) << BigInt(255)))).toBeNull()
    })

    it("Should compute the sqrt when the input 'n' is zero", async () => {
        expect(tonelliShanks(BigInt(0), BigInt(1))).toBe(BigInt(0))
    })

    it("Should not compute the sqrt when involves a range error", async () => {
        const fun = () => tonelliShanks(BigInt(1), BigInt(0))

        expect(fun).toThrow("Division by zero")
    })

    it("Should not compute the sqrt when the input 'n' does not have a square root in the field", async () => {
        expect(tonelliShanks(BigInt(-1), BigInt(1))).toBeNull()
    })
})
