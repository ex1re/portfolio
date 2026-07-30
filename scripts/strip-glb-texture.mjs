/**
 * Strips the baked texture out of a GLB, leaving geometry, UVs and materials.
 *
 * The supplied text-cylinder.glb is 1.1 MB, of which 99% is a 4096x1417 PNG with
 * the exporter's placeholder copy baked into it. The site draws its own texture
 * from the poem at runtime, so that image is dead weight — removing it leaves
 * about 12 KB of actual model.
 *
 * Usage: node scripts/strip-glb-texture.mjs <input.glb> <output.glb>
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const [input, output] = process.argv.slice(2)
if (!input || !output) {
  console.error('usage: node scripts/strip-glb-texture.mjs <input.glb> <output.glb>')
  process.exit(1)
}

const src = readFileSync(input)
if (src.toString('ascii', 0, 4) !== 'glTF') throw new Error(`${input} is not a GLB`)

const jsonLength = src.readUInt32LE(12)
const json = JSON.parse(src.toString('utf8', 20, 20 + jsonLength))
const binStart = 20 + jsonLength + 8
const bin = src.subarray(binStart, binStart + src.readUInt32LE(20 + jsonLength))

const imageViews = new Set((json.images ?? []).map((image) => image.bufferView))
if (imageViews.size === 0) throw new Error('no embedded images to strip')

// Only the simple case is supported: the images sit in the trailing bufferViews,
// so dropping them is a truncation and every surviving index stays valid.
const keep = json.bufferViews.filter((_, i) => !imageViews.has(i))
const firstImageView = Math.min(...imageViews)
if (keep.length !== firstImageView) {
  throw new Error('image bufferViews are not trailing; this script would corrupt indices')
}

const keptEnd = keep.reduce((end, bv) => Math.max(end, (bv.byteOffset ?? 0) + bv.byteLength), 0)

json.bufferViews = keep
json.buffers[0].byteLength = keptEnd
delete json.images
delete json.textures
delete json.samplers
for (const material of json.materials ?? []) {
  delete material.pbrMetallicRoughness?.baseColorTexture
}

// Both chunks are padded to 4-byte boundaries: JSON with spaces, BIN with zeros.
const pad = (n, to = 4) => (to - (n % to)) % to
const jsonBuf = Buffer.from(JSON.stringify(json), 'utf8')
const jsonPadded = Buffer.concat([jsonBuf, Buffer.alloc(pad(jsonBuf.length), 0x20)])
const binTrimmed = bin.subarray(0, keptEnd)
const binPadded = Buffer.concat([binTrimmed, Buffer.alloc(pad(binTrimmed.length), 0)])

const header = Buffer.alloc(12)
header.write('glTF', 0, 'ascii')
header.writeUInt32LE(2, 4)
header.writeUInt32LE(12 + 8 + jsonPadded.length + 8 + binPadded.length, 8)

const chunk = (data, type) => {
  const head = Buffer.alloc(8)
  head.writeUInt32LE(data.length, 0)
  head.write(type, 4, 'ascii')
  return Buffer.concat([head, data])
}

mkdirSync(dirname(output), { recursive: true })
writeFileSync(output, Buffer.concat([header, chunk(jsonPadded, 'JSON'), chunk(binPadded, 'BIN\0')]))

console.log(
  `${input} ${(src.length / 1024).toFixed(0)} KB -> ${output} ${(
    (12 + 8 + jsonPadded.length + 8 + binPadded.length) / 1024
  ).toFixed(1)} KB`,
)
