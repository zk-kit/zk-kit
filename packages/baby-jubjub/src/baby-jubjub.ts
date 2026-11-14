import { leBigIntToBuffer, leBufferToBigInt } from "@zk-kit/utils/conversions"
import F1Field from "@zk-kit/utils/f1-field"
import * as scalar from "@zk-kit/utils/scalar"
import * as sqrt from "./sqrt"
import { Point } from "./types"

/**
 * Constants and curve parameters for BabyJubJub elliptic curve operations.
 * See: {@link https://eips.ethereum.org/EIPS/eip-2494}
 */

// Prime order of the alt_bn128 curve.
export const r = BigInt("21888242871839275222246405745257275088548364400416034343698204186575808495617")

// Prime finite field 'F' with r elements (F_r).
export const Fr = new F1Field(r)

// Base point for generating other points on the Baby Jubjub curve.
export const Base8: Point<bigint> = [
    Fr.e(BigInt("5299619240641551281634865583518297030282874472190772894086521144482721001553")),
    Fr.e(BigInt("16950150798460657717958625567821834550301663161624707787222815936182638968203"))
]

// Curve parameters from the equation 'ax^2 + y^2 = 1 + dx^2y^2',
// representing a Twisted Edwards Elliptic Curve E defined over 'F_r'.
const a = Fr.e(BigInt("168700"))
const d = Fr.e(BigInt("168696"))

// The Baby JubJub curve 'E(F_r)' is equal to the subgroup of 'F_r'-rational points of 'E'.
export const order = BigInt("21888242871839275222246405745257275088614511777268538073601725287587578984328")
export const subOrder = scalar.shiftRight(order, BigInt(3))

/**
 * Performs point addition on the Baby Jubjub elliptic curve,
 * calculating a third point from two given points.
 * Let P1 = (x1, y1) and P2 = (x2, y2) be two arbitrary points of the curve.
 * Then P1 + P2 = (x3, y3) is calculated in the following way:
 * x3 = (x1*y2 + y1*x2)/(1 + d*x1*x2*y1*y2)
 * y3 = (y1*y2 - a*x1*x2)/(1 - d*x1*x2*y1*y2)
 * @param p1 First point on the curve.
 * @param p2 Second point on the curve.
 * @returns Resultant third point on the curve.
 */
export function addPoint(p1: Point<bigint>, p2: Point<bigint>): Point<bigint> {
    // beta = x1*y2
    const beta = Fr.mul(p1[0], p2[1])
    // gamma = y1*x2
    const gamma = Fr.mul(p1[1], p2[0])
    // delta = (y1-(a*x1))*(x2+y2)
    const delta = Fr.mul(Fr.sub(p1[1], Fr.mul(a, p1[0])), Fr.add(p2[0], p2[1]))

    // x1*x2*y1*y2
    const tau = Fr.mul(beta, gamma)
    // d*x1*x2*y1*y2
    const dtau = Fr.mul(d, tau)

    // x3 = (x1*y2 + y1*x2)/(1 + d*x1*x2*y1*y2)
    const p3x = Fr.div(Fr.add(beta, gamma), Fr.add(Fr.one, dtau))
    // y3 = (y1*y2 - a*x1*x2)/(1 - d*x1*x2*y1*y2)
    const p3y = Fr.div(Fr.add(delta, Fr.sub(Fr.mul(a, beta), gamma)), Fr.sub(Fr.one, dtau))

    return [p3x, p3y]
}

/**
 * Performs a scalar multiplication by starting from the 'base' point and 'adding'
 * it to itself 'e' times.
 * @param base The base point used as a starting point.
 * @param e A secret number representing the private key.
 * @returns The resulting point representing the public key.
 */
export function mulPointEscalar(base: Point<bigint>, e: bigint): Point<bigint> {
    let res: Point<bigint> = [Fr.e(BigInt(0)), Fr.e(BigInt(1))]
    let rem: bigint = e
    let exp: Point<bigint> = base

    while (!scalar.isZero(rem)) {
        if (scalar.isOdd(rem)) {
            res = addPoint(res, exp)
        }

        exp = addPoint(exp, exp)
        rem = scalar.shiftRight(rem, BigInt(1))
    }

    return res
}

/**
 * Determines if a given point lies on the Baby Jubjub elliptic curve by verifying the curve equation.
 * This function checks if the point satisfies the curve equation `ax^2 + y^2 = 1 + dx^2y^2`.
 * @param p The point to check, represented as a pair of bigint values.
 * @returns True if the point is on the curve, otherwise false.
 */
export function inCurve(p: Point): boolean {
    const x1 = BigInt(p[0])
    const y1 = BigInt(p[1])

    const x2 = Fr.square(x1)
    const y2 = Fr.square(y1)

    return Fr.eq(Fr.add(Fr.mul(a, x2), y2), Fr.add(Fr.one, Fr.mul(Fr.mul(x2, y2), d)))
}

/**
 * Packs a point on the Baby Jubjub elliptic curve into a bigint.
 * This process involves converting the y-coordinate to a buffer and conditionally modifying the last byte
 * to encode the sign of the x-coordinate, following a specific compact representation format.
 * @param unpackedPoint The point to be packed, consisting of x and y coordinates.
 * @returns The packed representation of the point as a bigint.
 */
export function packPoint(unpackedPoint: Point<bigint>): bigint {
    const buffer = leBigIntToBuffer(unpackedPoint[1], 32)

    if (Fr.lt(unpackedPoint[0], Fr.zero)) {
        buffer[31] |= 0x80
    }

    return leBufferToBigInt(buffer)
}

/**
 * Unpacks a bigint back into a point on the Baby Jubjub elliptic curve, reversing the packing process.
 * This involves interpreting the bigint as the y-coordinate and extracting the sign of the x-coordinate
 * from the encoded format. The function then calculates the x-coordinate using the curve equation.
 * @param packedPoint The packed point as a bigint.
 * @returns The unpacked point as a pair of bigint values, or null if the point is invalid.
 */
export function unpackPoint(packedPoint: bigint): Point<bigint> | null {
    const buffer = leBigIntToBuffer(packedPoint)
    const unpackedPoint = new Array(2)

    let sign = false

    if (buffer[31] & 0x80) {
        sign = true
        buffer[31] &= 0x7f
    }

    unpackedPoint[1] = leBufferToBigInt(buffer)

    // The y coordinate must be a canonical field element (y < r), otherwise y and
    // y + r would be two encodings of the same point.
    if (!scalar.gt(r, unpackedPoint[1])) {
        return null
    }

    const y2 = Fr.square(unpackedPoint[1])

    let x = sqrt.tonelliShanks(Fr.div(Fr.sub(Fr.one, y2), Fr.sub(a, Fr.mul(d, y2))), r)

    if (x == null) {
        return null
    }

    if (sign) {
        // x = 0 has no negative, so a set sign bit would be a second encoding
        // of the same point (as in RFC 8032, section 5.1.3).
        if (Fr.isZero(x)) {
            return null
        }

        x = Fr.neg(x)
    }

    unpackedPoint[0] = x

    return unpackedPoint as Point<bigint>
}
