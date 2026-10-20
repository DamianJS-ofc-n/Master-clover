import fs from 'fs'
import path from 'path'
import Crypto from 'crypto'
import ff from 'fluent-ffmpeg'
import webp from 'node-webpmux'

const tempDir = path.join(process.cwd(), 'temp')
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })

function getTempFilePath(ext) {
  return path.join(tempDir, `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.${ext}`)
}

async function imageToWebp(media) {
  const tmpIn = getTempFilePath('jpg')
  const tmpOut = getTempFilePath('webp')
  fs.writeFileSync(tmpIn, media)
  await new Promise((resolve, reject) => {
    ff(tmpIn)
      .on('error', reject)
      .on('end', () => resolve(true))
      .addOutputOptions([
        '-vcodec', 'libwebp',
        '-vf', "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15,pad=320:320:-1:-1:color=white@0.0,split[a][b];[a]palettegen=reserve_transparent=on:transparency_color=ffffff[p];[b][p]paletteuse"
      ])
      .toFormat('webp')
      .save(tmpOut)
  })
  const buff = fs.readFileSync(tmpOut)
  try { fs.unlinkSync(tmpIn) } catch {}
  try { fs.unlinkSync(tmpOut) } catch {}
  return buff
}

async function videoToWebp(media) {
  const tmpIn = getTempFilePath('mp4')
  const tmpOut = getTempFilePath('webp')
  fs.writeFileSync(tmpIn, media)
  await new Promise((resolve, reject) => {
    ff(tmpIn)
      .on('error', reject)
      .on('end', () => resolve(true))
      .addOutputOptions([
        '-vcodec', 'libwebp',
        '-vf', "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15,pad=320:320:-1:-1:color=white@0.0,split[a][b];[a]palettegen=reserve_transparent=on:transparency_color=ffffff[p];[b][p]paletteuse",
        '-loop', '0',
        '-ss', '00:00:00',
        '-t', '00:00:05',
        '-preset', 'default',
        '-an', '-vsync', '0'
      ])
      .toFormat('webp')
      .save(tmpOut)
  })
  const buff = fs.readFileSync(tmpOut)
  try { fs.unlinkSync(tmpIn) } catch {}
  try { fs.unlinkSync(tmpOut) } catch {}
  return buff
}

async function addExif(webpBuffer, metadata) {
  const tmpIn = getTempFilePath('webp')
  const tmpOut = getTempFilePath('webp')
  fs.writeFileSync(tmpIn, webpBuffer)

  let author = metadata.author || ''
  if (author.length > 340) author = author.slice(0, 340)

  const json = {
    'sticker-pack-id': 'itsuki.bot',
    'sticker-pack-name': metadata.packname || 'Itsuki Bot',
    'sticker-pack-publisher': author || 'Usuario',
    emojis: metadata.categories || ['🍧']
  }

  const exifAttr = Buffer.from([
    0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57,
    0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00
  ])
  const jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8')
  const exif = Buffer.concat([exifAttr, jsonBuff])
  exif.writeUIntLE(jsonBuff.length, 14, 4)

  const img = new webp.Image()
  await img.load(tmpIn)
  img.exif = exif
  await img.save(tmpOut)

  const result = fs.readFileSync(tmpOut)
  try { fs.unlinkSync(tmpIn) } catch {}
  try { fs.unlinkSync(tmpOut) } catch {}
  return result
}

async function writeExifImg(media, metadata) {
  const wMedia = await imageToWebp(media)
  return await addExif(wMedia, metadata)
}

async function writeExifVid(media, metadata) {
  const wMedia = await videoToWebp(media)
  return await addExif(wMedia, metadata)
}

async function writeExif(media, metadata) {
  let wMedia = /webp/.test(media.mimetype)
    ? media.data
    : /image/.test(media.mimetype)
      ? await imageToWebp(media.data)
      : /video/.test(media.mimetype)
        ? await videoToWebp(media.data)
        : null
  if (!wMedia) return null
  return await addExif(wMedia, metadata)
}

export default { imageToWebp, videoToWebp, writeExifImg, writeExifVid, writeExif }
export { imageToWebp, videoToWebp, writeExifImg, writeExifVid, writeExif }