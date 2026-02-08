const fs = require("fs")
const path = require("path")

const EXCLUDE_PKGS = ["circuits", "lazytower.circom", "lazytower.sol", "imt.sol", "rollup-plugin-rust"]
const packagesDir = path.join(__dirname, "packages")
const entryPoints = fs
    .readdirSync(packagesDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory() && !EXCLUDE_PKGS.includes(dirent.name))
    .map((dirent) => path.join("packages", dirent.name))

/** @type {import('typedoc').typedocoptions} */
module.exports = {
    entryPoints,
    name: "zk-kit",
    entryPointStrategy: "packages",
    excludeExternals: true
}
