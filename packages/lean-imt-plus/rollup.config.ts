import commonjs from "@rollup/plugin-commonjs"
import { nodeResolve } from "@rollup/plugin-node-resolve"
import terser from "@rollup/plugin-terser"
import typescript from "@rollup/plugin-typescript"
import fs from "fs"
import cleanup from "rollup-plugin-cleanup"
import { dts } from "rollup-plugin-dts"
import nodePolyfills from "rollup-plugin-polyfill-node"

const pkg = JSON.parse(fs.readFileSync("./package.json", "utf8"))
const banner = `/**
 * @module ${pkg.name}
 * @version ${pkg.version}
 * @file ${pkg.description}
 * @copyright Ethereum Foundation ${new Date().getFullYear()}
 * @license ${pkg.license}
 * @see [Github]{@link ${pkg.homepage}}
*/`

const name = pkg.name.substr(1).replace(/[-/]./g, (x: string) => x.toUpperCase()[1])

export default [
    {
        input: "src/index.ts",
        output: [
            { file: pkg.exports["."].require, format: "cjs", banner },
            { file: pkg.exports["."].default, format: "es", banner }
        ],
        external: [...Object.keys(pkg.dependencies)],
        plugins: [typescript({ tsconfig: "./build.tsconfig.json" }), cleanup({ comments: "jsdoc" })]
    },
    {
        input: "src/index.ts",
        output: [
            {
                file: pkg.iife,
                name,
                format: "iife",
                banner
            },
            {
                file: pkg.unpkg,
                name,
                format: "iife",
                plugins: [terser({ output: { preamble: banner } })]
            }
        ],
        external: [],
        plugins: [
            typescript({
                tsconfig: "./build.tsconfig.json"
            }),
            nodeResolve({ preferBuiltins: false, browser: true }),
            commonjs(),
            nodePolyfills(),
            cleanup({ comments: "jsdoc" })
        ]
    },
    {
        input: "src/index.ts",
        output: [{ file: "dist/index.d.ts", format: "es" }],
        plugins: [dts()]
    }
]
