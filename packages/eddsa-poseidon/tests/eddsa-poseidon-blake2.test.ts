import fs from "fs"
import path from "path"
import { bufferToHexadecimal, hexadecimalToBuffer } from "@zk-kit/utils"
import Blake2b from "../src/blake2b"

describe("Blake2b Basic test", () => {
    test("Should return the hash for a basic input", () => {
        // From the example computation in the RFC
        const instance = new Blake2b()
        instance.update(Buffer.from("abc"))

        expect(bufferToHexadecimal(instance.digest())).toBe(
            "ba80a53f981c4d0d6a2797b69f12f6e94c212f14685ac4b74b12bb6fdbffa2d17d87c5392aab792dc252d5de4533cc9518d38aa8dbf1925ab92386edd4009923"
        )
    })

    test("Should return the hash for an empty string", () => {
        // From the example computation in the RFC
        const instance = new Blake2b()
        instance.update(Buffer.from(""))

        expect(bufferToHexadecimal(instance.digest())).toBe(
            "786a02f742015903c6c6fd852552d272912f4740e15847618a86e217f71f5419d25e1031afee585313896444934eb04b903a685b1448b755d56f701afe9be2ce"
        )
    })
    test("Should return the hash for a longer string", () => {
        // From the example computation in the RFC
        const instance = new Blake2b()
        instance.update(Buffer.from("The quick brown fox jumps over the lazy dog"))

        expect(bufferToHexadecimal(instance.digest())).toBe(
            "a8add4bdddfd93e4877d2746e62817b116364a1fa7bc148d95090bc7333b3673f82401cf7aa2e4cb1ecd90296e3f14cb5413f8ed77be73045b13914cdcd6a918"
        )
    })

    test("Should throw if the output length exceeds 64", () => {
        expect(() => new Blake2b(65)).toThrow("Illegal output length, expected 0 < length <= 64")
    })

    test("Should throw if the output length is negative", () => {
        expect(() => new Blake2b(-1)).toThrow("Illegal output length, expected 0 < length <= 64")
    })
})

test("Should match BLAKE2b official test vectors", () => {
    const contents = fs.readFileSync(path.resolve(__dirname, "./generated-test-vectors.txt"), "utf8")
    contents.split("\n").forEach((line) => {
        if (line.length === 0) {
            return
        }
        const parts = line.split("\t")
        const inputHex = parts[0]
        const keyHex = parts[1]
        const outLen = Number(parts[2])
        const outHex = parts[3]

        const instance = new Blake2b(outLen, hexadecimalToBuffer(keyHex))
        instance.update(hexadecimalToBuffer(inputHex))
        expect(bufferToHexadecimal(instance.digest())).toBe(outHex)
    })
})
