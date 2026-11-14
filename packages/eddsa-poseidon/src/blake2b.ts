import blakejs, { type Blake2bCTX } from "blakejs"
import { HashFunction } from "./HashFunction"

// blakejs is a CommonJS module, so its functions are read from the default
// export: Node.js cannot resolve them as named ESM imports.
const { blake2bInit, blake2bUpdate, blake2bFinal } = blakejs

/**
 * @module Blake2b
 * Implements the Blake2b cryptographic hash function.
 * Blake2b is a second iteration of the blake algorithm
 *
 * This code is a wrapper around the "blakeJS" JavaScript library.
 * It supports hashing with optional keys, or output length  for enhanced security in certain contexts.
 */

export default class Blake2b implements HashFunction {
    key: Uint8Array | null = null
    outlen: number = 64
    context: Blake2bCTX
    /**
     * Constructor of the Blake2b engine
     * @param outlen The fixed output length of the generated hash
     * @param key Optional key parameter if keyed hashes are required
     * @returns This instance, to allow method chaining.
     */
    constructor(outlen: number = 64, key?: Uint8Array) {
        if (key) this.key = key
        if (outlen <= 0 || outlen > 64) throw new Error("Illegal output length, expected 0 < length <= 64")
        else this.outlen = outlen

        this.context = blake2bInit(this.outlen, key)
    }

    /**
     * Updates the hash with new data. This method can be called multiple
     * times to incrementally add data to the hash computation.
     * @param input The data to add to the hash.
     * @returns The instance, to allow method chaining.
     */
    update(input: Buffer) {
        blake2bUpdate(this.context, input)
        return this
    }

    /**
     * Completes the hash computation and returns the final hash value.
     * This method applies the necessary padding, performs the final compression,
     * and returns the output.
     * @returns The Blake2b hash of the input data.
     */
    digest() {
        return Buffer.from(blake2bFinal(this.context))
    }
}
