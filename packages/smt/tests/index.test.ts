import { poseidon, smt } from "circomlibjs"
import sha256 from "crypto-js/sha256"
import { BarretenbergSync, Fr } from "@aztec/bb.js"
import { ChildNodes, SMT } from "../src"

describe("SMT", () => {
    const hashes = {
        sha256: (childNodes: ChildNodes) => childNodes.join(""),
        poseidon2: (childNodes: ChildNodes) => childNodes.join(""),
        pedersen: (childNodes: ChildNodes) => childNodes.join(""),
        poseidon: (childNodes: ChildNodes) => childNodes.join("")
    }

    const testKeys = ["a", "3", "2b", "20", "9", "17"]

    beforeAll(async () => {
        const bb = await BarretenbergSync.new()
        hashes.sha256 = (childNodes: ChildNodes) => sha256(childNodes.join("")).toString()
        hashes.poseidon2 = (childNodes: ChildNodes) =>
            bb
                .poseidon2Hash([Fr.fromString(childNodes.join(""))])
                .toString()
                .slice(2)
        hashes.pedersen = (childNodes: ChildNodes) =>
            bb
                .pedersenHash([Fr.fromString(childNodes.join(""))], 0)
                .toString()
                .slice(2)
        hashes.poseidon = (childNodes: ChildNodes) => poseidon(childNodes)
    })

    describe("Create hexadecimal trees", () => {
        it.each([["sha256"], ["poseidon2"], ["pedersen"]])("Should create an empty sparse Merkle tree - %s", (hash) => {
            const tree = new SMT(hashes[hash as keyof typeof hashes])

            expect(tree.root).toBe("0")
        })

        it.each([["poseidon"]])(
            "Should not create a hexadecimal tree if the hash function does not return a hexadecimal",
            (hash) => {
                const fun = () => new SMT(hashes[hash as keyof typeof hashes])

                expect(fun).toThrow()
            }
        )
    })

    describe("Add new entries (key/value) in the tree", () => {
        it.each([["sha256"], ["poseidon2"], ["pedersen"]])("Should add a new entry - %s", (hash) => {
            const tree = new SMT(hashes[hash as keyof typeof hashes])
            const oldRoot = tree.root

            tree.add("2", "a")

            expect(tree.root).not.toEqual(oldRoot)
        })

        it.each([["sha256"], ["poseidon2"], ["pedersen"]])(
            "Should not add a new non-hexadecimal entry - %s",
            (hash) => {
                const tree = new SMT(hashes[hash as keyof typeof hashes])

                const fun = () => tree.add(BigInt(2), BigInt(4))

                expect(fun).toThrow()
            }
        )

        it.each([["sha256"], ["poseidon2"], ["pedersen"]])(
            "Should not add a new entry with an existing key - %s",
            (hash) => {
                const tree = new SMT(hashes[hash as keyof typeof hashes])

                tree.add("2", "a")
                const fun = () => tree.add("2", "a")

                expect(fun).toThrow()
            }
        )

        it.each([
            ["sha256", "40770450d00520bdab58e115dd4439c20cd39028252f3973e81fb15b02eb28f7"],
            ["poseidon2", "2d7cc420e66d3accf1c6fc78528ed5ce2453cc5fd7341e58ad283735f9b1f819"],
            ["pedersen", "034fab1996e408dab73e2bfdc79f2d4e108eac5f015c86d4e01c3c23ea4c2a91"]
        ])("Should add 6 new entries and create the root hash - %s", (hash, expected) => {
            const tree = new SMT(hashes[hash as keyof typeof hashes])

            for (const key of testKeys) {
                tree.add(key, key)
            }

            expect(tree.root).toBe(expected)
        })
    })

    describe("Get values from the tree", () => {
        it.each([["sha256"], ["poseidon2"], ["pedersen"]])(
            "Should get a value from the tree using an existing key - %s",
            (hash) => {
                const tree = new SMT(hashes[hash as keyof typeof hashes])

                tree.add("2", "a")
                const value = tree.get("2")

                expect(value).toBe("a")
            }
        )

        it.each([["sha256"], ["poseidon2"], ["pedersen"]])(
            "Should not get a value from the tree using a non-existing key",
            (hash) => {
                const tree = new SMT(hashes[hash as keyof typeof hashes])

                tree.add("2", "a")
                const value = tree.get("1")

                expect(value).toBeUndefined()
            }
        )
    })

    describe("Update values in the tree", () => {
        it.each([
            ["sha256", "c75d3f1f5bcd6914d0331ce5ec17c0db8f2070a2d4285f8e3ff11c6ca19168ff"],
            ["poseidon2", "0dbd8e6fcb7142f82c1020310bd60ebcae77810fd0709f77ff416bdd03fe672e"],
            ["pedersen", "1b75020b0ce47cc48a4f00209aa225406c54a3288d8a1ef92e39cf5e80e7d7a5"]
        ])("Should update a value of an existing key - Poseidon1 - %s", (hash, expected) => {
            const tree = new SMT(hashes[hash as keyof typeof hashes])

            tree.add("2", "a")
            tree.update("2", "5")

            expect(tree.root).toBe(expected)
        })

        it.each([["sha256"], ["poseidon2"], ["pedersen"]])(
            "Should not update a value with a non-existing key - %s",
            (hash) => {
                const tree = new SMT(hashes[hash as keyof typeof hashes])

                const fun = () => tree.update("1", "5")

                expect(fun).toThrow()
            }
        )
    })

    describe("Delete entries from the tree", () => {
        it.each([["sha256"], ["poseidon2"], ["pedersen"]])(
            "Should delete an entry with an existing key - %s",
            (hash) => {
                const tree = new SMT(hashes[hash as keyof typeof hashes])

                tree.add("2", "a")
                tree.delete("2")

                expect(tree.root).toBe("0")
            }
        )

        it.each([
            ["sha256", "5d2bfda7c24d9e9e59fe89a271f7d0a3435892c98bc1121b9b590d800deeca10"],
            ["poseidon2", "18dca814d672b1829da81727f3a1db8c36e4eaa87d727a76498367abdd1a6a84"],
            ["pedersen", "1e6e5d4a34fa89594da39f111a71aff6c7a55f03b593e6e87a73a877061568f8"]
        ])("Should delete 3 entries and create the root hash - %s", (hash, expected) => {
            const tree = new SMT(hashes[hash as keyof typeof hashes])

            for (const key of testKeys) {
                tree.add(key, key)
            }

            tree.delete(testKeys[1])
            tree.delete(testKeys[3])
            tree.delete(testKeys[4])

            expect(tree.root).toBe(expected)
        })

        it.each([["sha256"], ["poseidon2"], ["pedersen"]])(
            "Should not delete an entry with a non-existing key - %s",
            (hash) => {
                const tree = new SMT(hashes[hash as keyof typeof hashes])

                const fun = () => tree.delete("1")

                expect(fun).toThrow()
            }
        )
    })

    describe("Create Merkle proofs and verify them", () => {
        it.each([["sha256"], ["poseidon2"], ["pedersen"]])(
            "Should create some Merkle proofs and verify them - %s",
            (hash) => {
                const tree = new SMT(hashes[hash as keyof typeof hashes])

                for (const key of testKeys) {
                    tree.add(key, key)
                }

                for (let i = 0; i < 100; i += 1) {
                    const randomKey = Math.floor(Math.random() * 100).toString(16)
                    const proof = tree.createProof(randomKey)

                    expect(tree.verifyProof(proof)).toBeTruthy()
                }

                tree.add("12", "1")

                const proof = tree.createProof("6")
                expect(tree.verifyProof(proof)).toBeTruthy()
            }
        )

        it.each([["sha256"], ["poseidon2"], ["pedersen"]])("Should not verify an invalid Merkle proof - %s", (hash) => {
            const tree = new SMT(hashes[hash as keyof typeof hashes])

            for (const key of testKeys) {
                tree.add(key, key)
            }

            const proof = tree.createProof("19")
            proof.matchingEntry = ["20", "a"]

            expect(tree.verifyProof(proof)).toBeFalsy()
        })
    })

    describe("Create big number trees", () => {
        it.each([["poseidon"]])("Should create a big number tree - %s", (hash) => {
            const tree = new SMT(hashes[hash as keyof typeof hashes], true)

            expect(tree.root).toEqual(BigInt(0))
        })

        it.each([["sha256"]])(
            "Should not create a big number tree if the hash function does not return a big number",
            (hash) => {
                const fun = () => new SMT(hashes[hash as keyof typeof hashes], true)

                expect(fun).toThrow()
            }
        )

        it.each([["poseidon"]])("Should add a big number new entry - %s", (hash) => {
            const tree = new SMT(hashes[hash as keyof typeof hashes], true)
            const oldRoot = tree.root

            tree.add(BigInt(2), BigInt(4))

            expect(tree.root).not.toEqual(oldRoot)
        })

        it.each([["poseidon"]])("Should not add a new non-big number entry - %s", (hash) => {
            const tree = new SMT(hashes[hash as keyof typeof hashes], true)

            const fun = () => tree.add("2", "a")

            expect(fun).toThrow()
        })
    })

    describe("Matching with Circomlib smt implementation", () => {
        it.each([["poseidon"]])(
            "Should create two trees with different implementations and match their root nodes",
            async (hash) => {
                const tree = new SMT(hashes[hash as keyof typeof hashes], true)
                const tree2 = await smt.newMemEmptyTrie()
                const entries: any = [
                    [
                        BigInt("20438969296305830531522370305156029982566273432331621236661483041446048135547"),
                        BigInt("17150136040889237739751319962368206600863150289695545292530539263327413090784")
                    ],
                    [
                        BigInt("8459688297517826598613412977307486050019239051864711035321718508109192087854"),
                        BigInt("8510347201346963732943571140849185725417245763047403804445415726302354045170")
                    ],
                    [
                        BigInt("18746990989203767017840856832962652635369613415011636432610873672704085238844"),
                        BigInt("10223238458026721676606706894638558676629446348345239719814856822628482567791")
                    ],
                    [
                        BigInt("13924553918840562069536446401916499801909138643922241340476956069386532478098"),
                        BigInt("13761779908325789083343687318102407319424329800042729673292939195255502025802")
                    ]
                ]

                for await (const entry of entries) {
                    tree.add(entry[0], entry[1])
                    await tree2.insert(entry[0], entry[1])
                }

                expect(tree.root).toEqual(tree2.root)
            }
        )
    })
})
