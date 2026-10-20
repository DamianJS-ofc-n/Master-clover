import fs from 'fs'
import path from 'path'
import { randomBytes } from 'crypto'
import { exec } from 'child_process'
import { promisify } from 'util'
import webpmux from 'node-webpmux'

const execAsync = promisify(exec)
const tempFolder = path.join(process.cwd(), 'temp')
if (!fs.existsSync(tempFolder)) fs.mkdirSync(tempFolder, { recursive: true })

function randomFileName(ext) {
  return `${randomBytes(6).readUIntLE(0, 6).toString(36)}.${ext}`
}

async function imageToWebp(media) {
  const tmpIn = path.join(tempFolder, randomFileName('jpg'))
  const tmpOut = path.join(tempFolder, randomFileName('webp'))
  fs.writeFileSync(tmpIn, media)

  await new Promise((resolve, reject) => {
    exec(`ffmpeg -y -i "${tmpIn}" -vcodec libwebp -vf "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15,pad=320:320:-1:-1:color=white@0.0,split[a][b];[a]palettegen=reserve_transparent=on:transparency_color=ffffff[p];[b][p]paletteuse" "${tmpOut}"`,
      (err) => err ? reject(err) : resolve())
  })

  const buff = fs.readFileSync(tmpOut)
  try { fs.unlinkSync(tmpIn) } catch {}
  try { fs.unlinkSync(tmpOut) } catch {}
  return buff
}

async function videoToWebp(media) {
  const tmpIn = path.join(tempFolder, randomFileName('mp4'))
  const tmpOut = path.join(tempFolder, randomFileName('webp'))
  fs.writeFileSync(tmpIn, media)

  await new Promise((resolve, reject) => {
    exec(`ffmpeg -y -i "${tmpIn}" -vcodec libwebp -vf "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15,pad=320:320:-1:-1:color=white@0.0,split[a][b];[a]palettegen=reserve_transparent=on:transparency_color=ffffff[p];[b][p]paletteuse" -loop 0 -ss 00:00:00 -t 00:00:05 -preset default -an -vsync 0 "${tmpOut}"`,
      (err) => err ? reject(err) : resolve())
  })

  const buff = fs.readFileSync(tmpOut)
  try { fs.unlinkSync(tmpIn) } catch {}
  try { fs.unlinkSync(tmpOut) } catch {}
  return buff
}

async function addExif(webpBuffer, metadata) {
  const tmpIn = path.join(tempFolder, randomFileName('webp'))
  const tmpOut = path.join(tempFolder, randomFileName('webp'))
  fs.writeFileSync(tmpIn, webpBuffer)

  let author = metadata.author || ''
  if (author.length > 340) author = author.slice(0, 340)

  const json = {
    "sticker-pack-id": "itsuki.bot",
    "sticker-pack-name": metadata.packname || 'Itsuki Bot',
    "sticker-pack-publisher": author || 'Usuario',
    "emojis": ["🍧"]
  }

  const exifAttr = Buffer.from([
    0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57,
    0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00
  ])
  const jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8')
  const exif = Buffer.concat([exifAttr, jsonBuff])
  exif.writeUIntLE(jsonBuff.length, 14, 4)

  const img = new webpmux.Image()
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

export const handler = {}

handler.name = 's'
handler.alias = ['sticker', 'stiker']
handler.category = 'utils'
handler.description = 'Convierte imagen/video/sticker a sticker'

handler.exec = async (sock, m) => {
  const jid = m.key.remoteJid
  const ctx = m.message?.extendedTextMessage?.contextInfo
  const quotedMsg = ctx?.quotedMessage
  const quotedStanzaId = ctx?.stanzaId
  const quotedParticipant = ctx?.participant

  let msgToDownload = null
  let type = ''
  let isSticker = false

  if (quotedMsg?.imageMessage) {
    msgToDownload = { key: { remoteJid: jid, id: quotedStanzaId, fromMe: false, participant: quotedParticipant }, message: quotedMsg }
    type = 'image'
  } else if (quotedMsg?.videoMessage) {
    msgToDownload = { key: { remoteJid: jid, id: quotedStanzaId, fromMe: false, participant: quotedParticipant }, message: quotedMsg }
    type = 'video'
  } else if (quotedMsg?.stickerMessage) {
    msgToDownload = { key: { remoteJid: jid, id: quotedStanzaId, fromMe: false, participant: quotedParticipant }, message: quotedMsg }
    type = 'sticker'
    isSticker = true
  } else if (m.message?.imageMessage) {
    msgToDownload = m
    type = 'image'
  } else if (m.message?.videoMessage) {
    msgToDownload = m
    type = 'video'
  } else if (m.message?.stickerMessage) {
    msgToDownload = m
    type = 'sticker'
    isSticker = true
  } else {
    return sock.sendMessage(jid, { text: `《✧》 Responde a imagen/video/sticker con .s` }, { quoted: m })
  }

  try {
    let downloadMediaMessage
    try { ({ downloadMediaMessage } = await import('baileys')) } catch { ({ downloadMediaMessage } = await import('@whiskeysockets/baileys')) }

    await sock.sendMessage(jid, { react: { text: '🕒', key: m.key } })

    const buffer = await downloadMediaMessage(msgToDownload, 'buffer', {}, { logger: console, reuploadRequest: sock.updateMediaMessage })

    if (!buffer || buffer.length === 0) throw new Error('No se pudo descargar el archivo')

    let groupName = 'Privado'
    try {
      if (jid.endsWith('@g.us')) {
        const meta = await sock.groupMetadata(jid)
        if (meta?.subject) groupName = meta.subject
      }
    } catch {}

    const pushName = m.pushName || 'Usuario'

    const packname = `⚔️ El mejor bot master\n  ͜─͜─͜━͜━͜─͜─͜━͜━͜─͜─͜━͜━͜ㅤ\n\n𖹭 group: ${groupName}\n𖹭 creador: ${pushName}`

    const metadata = {
      packname,
      author: 'Dev Damián '
    }

    let stickerBuffer
    if (isSticker) {
      stickerBuffer = await addExif(buffer, metadata)
    } else if (type === 'image') {
      stickerBuffer = await writeExifImg(buffer, metadata)
    } else {
      stickerBuffer = await writeExifVid(buffer, metadata)
    }

    await sock.sendMessage(jid, { sticker: stickerBuffer }, { quoted: m })
    await sock.sendMessage(jid, { react: { text: '✔️', key: m.key } })

  } catch (e) {
    console.log('[S]', e.message)
    await sock.sendMessage(jid, { react: { text: '✖️', key: m.key } })
    await sock.sendMessage(jid, { text: `《✧》 Error: ${e.message}`.slice(0, 1000) }, { quoted: m })
  }
}