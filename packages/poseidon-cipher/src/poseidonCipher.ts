// https://github.com/weijiekoh/circomlib/blob/feat/poseidon-encryption/
// all credits for this implementation go to https://github.com/weijiekoh

// paper: https://drive.google.com/file/d/1EVrP3DzoGbmzkRmYnyEDcIQcXVU7GlOd/view

import { Fr } from "@zk-kit/baby-jubjub"

import { checkEqual, poseidonPerm } from "./utils"
import { two128 } from "./constants"
import { CipherText, EncryptionKey, Nonce, PlainText } from "./types"

/**
 * SECURITY WARNING: This implementation uses JavaScript's native BigInt which is not constant-time
 * and may be vulnerable to timing attacks. If your application requires protection against timing attacks,
 * consider using a constant-time cryptographic library instead.
 * See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt#cryptography
 * This issue is tracked in GitHub issue #341: https://github.com/zk-kit/zk-kit/issues/341
 */

/**
 * Encrypt some plaintext using poseidon encryption
 * @param msg - the message to encrypt
 * @param key - the key to encrypt with
 * @param nonce - the nonce to avoid replay attacks
 * @returns the ciphertext
 */
export const poseidonEncrypt = (
    msg: PlainText<bigint>,
    key: EncryptionKey<bigint>,
    nonce: Nonce<bigint>
): CipherText<bigint> => {
    // prepare the message
    msg = msg.map((x) => Fr.e(x))

    // The nonce must be less than 2 ^ 128
    if (nonce >= two128) throw new Error("The nonce must be less than 2 ^ 128")

    // create a copy
    const message = [...msg]

    // Pad the message if needed
    while (message.length % 3 > 0) {
        message.push(Fr.zero)
    }

    // Create the initial state
    // S = (0, kS[0], kS[1], N + l ∗ 2^128).
    let state = [Fr.zero, Fr.e(key[0]), Fr.e(key[1]), Fr.add(Fr.e(nonce), Fr.mul(Fr.e(BigInt(msg.length)), two128))]

    const ciphertext = []

    for (let i = 0; i < message.length / 3; i += 1) {
        // Iterate Poseidon on the state
        state = poseidonPerm(state)

        // Absorb three elements of message
        state[1] = Fr.add(state[1], Fr.e(message[i * 3]))
        state[2] = Fr.add(state[2], Fr.e(message[i * 3 + 1]))
        state[3] = Fr.add(state[3], Fr.e(message[i * 3 + 2]))

        // Release three elements of the ciphertext
        ciphertext.push(state[1])
        ciphertext.push(state[2])
        ciphertext.push(state[3])
    }

    // Iterate Poseidon on the state one last time
    state = poseidonPerm(state)

    // Release the last ciphertext element
    ciphertext.push(state[1])

    return ciphertext
}

/**
 * Decrypt some ciphertext using poseidon encryption
 * @param ciphertext the ciphertext to decrypt
 * @param key the key to decrypt with
 * @param nonce the nonce used to encrypt
 * @param length the length of the plaintext
 * @returns the plaintext
 */
export const poseidonDecrypt = (
    ciphertext: CipherText<bigint>,
    key: EncryptionKey<bigint>,
    nonce: Nonce<bigint>,
    length: number
): PlainText<bigint> => {
    // Create the initial state
    // S = (0, kS[0], kS[1], N + l ∗ 2^128).
    let state = [Fr.zero, Fr.e(key[0]), Fr.e(key[1]), Fr.add(Fr.e(nonce), Fr.mul(Fr.e(BigInt(length)), two128))]

    const message = []

    const n = Math.floor(ciphertext.length / 3)

    for (let i = 0; i < n; i += 1) {
        // Iterate Poseidon on the state
        state = poseidonPerm(state)

        // Release three elements of the message
        message.push(Fr.sub(ciphertext[i * 3], state[1]))
        message.push(Fr.sub(ciphertext[i * 3 + 1], state[2]))
        message.push(Fr.sub(ciphertext[i * 3 + 2], state[3]))

        // Modify the state
        state[1] = ciphertext[i * 3]
        state[2] = ciphertext[i * 3 + 1]
        state[3] = ciphertext[i * 3 + 2]
    }

    // If length > 3, check if the last (3 - (l mod 3)) elements of the message
    // are 0
    if (length > 3) {
        if (length % 3 === 2) {
            checkEqual(message[message.length - 1], Fr.zero, "The last element of the message must be 0")
        } else if (length % 3 === 1) {
            checkEqual(message[message.length - 1], Fr.zero, "The last element of the message must be 0")
            checkEqual(message[message.length - 2], Fr.zero, "The second to last element of the message must be 0")
        }
    }

    // Iterate Poseidon on the state one last time
    state = poseidonPerm(state)

    // Check the last ciphertext element
    checkEqual(
        ciphertext[ciphertext.length - 1],
        state[1],
        "The last ciphertext element must match the second item of the permuted state"
    )

    return message.slice(0, length)
}

/**
 * Decrypt some ciphertext using poseidon encryption
 * @dev Do not throw if the plaintext is invalid
 * @param ciphertext the ciphertext to decrypt
 * @param key the key to decrypt with
 * @param nonce the nonce used to encrypt
 * @param length the length of the plaintext
 * @returns the plaintext
 */
export const poseidonDecryptWithoutCheck = (
    ciphertext: CipherText<bigint>,
    key: EncryptionKey<bigint>,
    nonce: Nonce<bigint>,
    length: number
): PlainText<bigint> => {
    // Create the initial state
    // S = (0, kS[0], kS[1], N + l ∗ 2^128).
    let state = [Fr.zero, Fr.e(key[0]), Fr.e(key[1]), Fr.add(Fr.e(nonce), Fr.mul(Fr.e(BigInt(length)), two128))]

    const message = []

    const n = Math.floor(ciphertext.length / 3)

    for (let i = 0; i < n; i += 1) {
        // Iterate Poseidon on the state
        state = poseidonPerm(state)

        // Release three elements of the message
        message.push(Fr.sub(ciphertext[i * 3], state[1]))
        message.push(Fr.sub(ciphertext[i * 3 + 1], state[2]))
        message.push(Fr.sub(ciphertext[i * 3 + 2], state[3]))

        // Modify the state
        state[1] = ciphertext[i * 3]
        state[2] = ciphertext[i * 3 + 1]
        state[3] = ciphertext[i * 3 + 2]
    }

    return message.slice(0, length)
}
