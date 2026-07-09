/**
 * Converts a hexadecimal number to a binary number.
 * @param n A hexadecimal number.
 * @returns The relative binary number.
 */
export function hexToBin(n: string): string {
    let bin = Number(`0x${n[0]}`).toString(2)

    for (let i = 1; i < n.length; i += 1) {
        bin += Number(`0x${n[i]}`).toString(2).padStart(4, "0")
    }

    return bin
}

/**
 * Returns the binary representation of a key. For each key it is possible
 * to obtain an array of 256 padded bits.
 * @param key The key of a tree entry.
 * @returns The relative array of bits.
 */
export function keyToPath(key: string | bigint): number[] {
    const bits = typeof key === "bigint" ? key.toString(2) : hexToBin(key as string)

    return bits.padStart(256, "0").split("").reverse().map(Number)
}

/**
 * Returns the index of the last non-zero element of an array.
 * If there are only zero elements the function returns -1.
 * @param array An array of hexadecimal or big numbers.
 * @returns The index of the last non-zero element.
 */
export function getIndexOfLastNonZeroElement(array: any[]): number {
    for (let i = array.length - 1; i >= 0; i -= 1) {
        // More robust handling of different types of zero values
        if (array[i] === "0" || array[i] === 0 || array[i] === BigInt(0)) {
            continue;
        }

        if (typeof array[i] === "string" && /^0x0+$/.test(array[i])) {
            continue;
        }

        // If we reach here, the element is non-zero
        return i;
    }

    return -1
}

/**
 * Returns the first common elements of two arrays.
 * @param array1 The first array.
 * @param array2 The second array.
 * @returns The array of the first common elements.
 */
export function getFirstCommonElements(array1: any[], array2: any[]): any[] {
    const minArray = array1.length < array2.length ? array1 : array2

    for (let i = 0; i < minArray.length; i += 1) {
        if (array1[i] !== array2[i]) {
            return minArray.slice(0, i)
        }
    }

    return minArray.slice()
}

/**
 * Checks if a number is a hexadecimal number.
 * @param n A hexadecimal number.
 * @returns True if the number is a hexadecimal, false otherwise.
 */
export function checkHex(n: string): boolean {
    return typeof n === "string" && /^[0-9A-Fa-f]{1,64}$/.test(n)
}
