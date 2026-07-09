import { babyjub } from "circomlibjs"
import { utils } from "ffjavascript"
import { Base8, Point, addPoint, inCurve, mulPointEscalar, packPoint, r, unpackPoint } from "../src"
import { tonelliShanks } from "../src/sqrt"

describe("BabyJubjub", () => {
    const secretScalar = BigInt(324)

    let publicKey: Point<bigint>

    it("Should add the base point to the subgroup", async () => {
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

    it("Should check if a point is on the curve", async () => {
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

    it("Should unpack a packed public key with fewer than 32 bytes", async () => {
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

    it("Should not unpack a packed public key if the y-coordinate is not on the curve", async () => {
        const publicKey: Point<bigint> = [
            BigInt("10207164244839265210731148792003399330071235260758262804307337735329782473514"),
            BigInt(r + BigInt(1))
        ]

        const packedPoint = packPoint(publicKey)

        expect(unpackPoint(packedPoint)).toBeNull()
    })

    it("Should return zero when computing the sqrt of zero", async () => {
        expect(tonelliShanks(BigInt(0), BigInt(1))).toBe(BigInt(0))
    })

    it("Should throw when computing the sqrt with a zero modulus", async () => {
        const fun = () => tonelliShanks(BigInt(1), BigInt(0))

        expect(fun).toThrow("Division by zero")
    })

    it("Should return null when the input has no square root in the field", async () => {
        expect(tonelliShanks(BigInt(-1), BigInt(1))).toBeNull()
    })
})
