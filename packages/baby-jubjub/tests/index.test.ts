import { babyjub } from "circomlibjs"
import { utils } from "ffjavascript"
import * as scalar from "@zk-kit/utils/scalar"
import {
    Base8,
    Point,
    addPoint,
    inCurve,
    mulPointEscalar,
    packPoint,
    r,
    unpackPoint,
    order,
    subOrder,
    id
} from "../src"
import { tonelliShanks } from "../src/sqrt"

describe("BabyJubjub", () => {
    const secretScalar = BigInt(324)

    let publicKey: Point<bigint>

    it("Test point addition and inCurve", async () => {
        expect(inCurve(id)).toBeTruthy()
        expect(inCurve([BigInt(1), BigInt(0)])).toBeFalsy()
        expect(addPoint(id, id).toString()).toBe(id.toString())

        const p1: Point<bigint> = [
            BigInt("17777552123799933955779906779655732241715742912184938656739573121738514868268"),
            BigInt("2626589144620713026669568689430873010625803728049924121243784502389097019475")
        ]
        const p2: Point<bigint> = [
            BigInt("16540640123574156134436876038791482806971768689494387082833631921987005038935"),
            BigInt("20819045374670962167435360035096875258406992893633759881276124905556507972311")
        ]
        const p3: Point<bigint> = [
            BigInt("7916061937171219682591368294088513039687205273691143098332585753343424131937"),
            BigInt("14035240266687799601661095864649209771790948434046947201833777492504781204499")
        ]

        expect(inCurve(p1)).toBeTruthy()
        expect(inCurve(p2)).toBeTruthy()
        expect(inCurve(p3)).toBeTruthy()

        expect(addPoint(p1, p2).toString()).toBe(p3.toString())
    })

    it("Test point multiplication with small values", async () => {
        const P: Point<bigint> = [
            BigInt("17777552123799933955779906779655732241715742912184938656739573121738514868268"),
            BigInt("2626589144620713026669568689430873010625803728049924121243784502389097019475")
        ]

        expect(mulPointEscalar(P, BigInt(0)).toString()).toBe(id.toString())
        expect(mulPointEscalar(P, BigInt(1)).toString()).toBe(P.toString())
        expect(mulPointEscalar(P, BigInt(2)).toString()).toBe(addPoint(P, P).toString())
        expect(mulPointEscalar(P, BigInt(3)).toString()).toBe(addPoint(addPoint(P, P), P).toString())

        expect(mulPointEscalar(id, BigInt(1)).toString()).toBe(id.toString())
        expect(mulPointEscalar(id, BigInt(14134324)).toString()).toBe(id.toString())
    })

    it("Test base point order", async () => {
        expect(scalar.shiftRight(order, BigInt(3))).toBe(subOrder)
        const G: Point<bigint> = [
            BigInt("995203441582195749578291179787384436505546430278305826713579947235728471134"),
            BigInt("5472060717959818805561601436314318772137091100104008585924551046643952123905")
        ]
        const p1: Point<bigint> = mulPointEscalar(G, BigInt(8) * subOrder)
        expect(p1.toString()).toBe(id.toString())
        const p2 = mulPointEscalar(Base8, subOrder)
        expect(p2.toString()).toBe(id.toString())

        const random = BigInt("38275423985628165")
        expect(mulPointEscalar(Base8, random).toString()).toBe(
            mulPointEscalar(Base8, random + BigInt(543523) * subOrder).toString()
        )
    })

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
