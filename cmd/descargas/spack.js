import axios from 'axios'
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'
import crypto from 'crypto'

export const handler = {}

handler.name = 'spack'
handler.alias = ['stickerpack', 'pinpack']
handler.category = 'busquedas'

let config = null

for (const p of [
 path.join(process.cwd(), 'config.js'),
 path.resolve('./config.js')
]) {
 if (fs.existsSync(p)) {
 try {
 const mod = await import(pathToFileURL(p).href)
 config = mod.default || mod
 break
 } catch {}
 }
}

if (!config) config = { bot: { name: 'Clover-BOT' } }

function getMyData(sock) {
 try {
 let num = sock?.user?.id?.split(':')[0]
 ?.replace(/\D/g, '') || 'main'

 let customName = null

 const jadiPath = path.join(
 process.cwd(),
 'jadiBots',
 num,
 'config.json'
 )

 if (fs.existsSync(jadiPath)) {
 try {
 const j = JSON.parse(
 fs.readFileSync(jadiPath, 'utf8')
 )
 if (j.name) customName = j.name
 } catch {}
 }

 if (sock.subConfig?.name) {
 customName = sock.subConfig.name
 }

 if (fs.existsSync('./db/custom_main.json')) {
 try {
 const d = JSON.parse(
 fs.readFileSync('./db/custom_main.json', 'utf8')
 )
 if (d.name) customName = d.name
 } catch {}
 }

 return {
 botName: customName ||
 config?.bot?.name ||
 'Clover-BOT'
 }

 } catch {
 return {
 botName: config?.bot?.name || 'Clover-BOT'
 }
 }
}

// API ORIGINAL
const KEY = 'hk_live_emalahxKe_Y5yamxR2ysovb70Niz_BUBRFrcq0M4YQA'

const BASE =
 'https://hikariapi.skyultraweb.com/api/scrapers/pinterest/search'

async function searchPinterest(q, limit) {
 const { data } = await axios.get(BASE, {
 params: {
 q,
 limit: limit + 20,
 apikey: KEY
 },
 timeout: 25000
 })

 const list = Array.isArray(data?.data)
 ? data.data
 : []

 return [...new Set(
 list
 .map(r => r.imageProxy || r.image)
 .filter(u =>
 typeof u === 'string' &&
 /^https?:\/\//i.test(u)
 )
 )]
}

// CONVERTIR IMAGEN A WEBP COMPATIBLE
async function convertSticker(input) {
 const qualities = [85, 70, 55, 40]

 for (const quality of qualities) {
 const output = await sharp(input, {
 limitInputPixels: 25000000
 })
 .rotate()
 .resize(512, 512, {
 fit: 'contain',
 background: {
 r: 0,
 g: 0,
 b: 0,
 alpha: 0
 }
 })
 .webp({
 quality,
 effort: 4,
 lossless: false
 })
 .toBuffer()

 const info = await sharp(output).metadata()

 if (
 info.format === 'webp' &&
 info.width === 512 &&
 info.height === 512 &&
 output.length <= 100 * 1024
 ) {
 return output
 }
 }

 throw new Error('Imagen demasiado pesada')
}

// DESCARGAR IMAGEN
async function downloadSticker(url) {
 const response = await axios.get(url, {
 responseType: 'arraybuffer',
 timeout: 18000,
 maxContentLength: 10 * 1024 * 1024,
 headers: {
 'User-Agent': 'Mozilla/5.0',
 'Accept': 'image/*'
 }
 })

 const input = Buffer.from(response.data)

 if (!input.length) {
 throw new Error('Imagen vacía')
 }

 return await convertSticker(input)
}

handler.exec = async (sock, m) => {
 const from = m.key.remoteJid

 const body =
 m.message?.conversation ||
 m.message?.extendedTextMessage?.text ||
 ''

 const argsRaw = body.trim().split(/\s+/).slice(1)

 if (!argsRaw.length) {
 return sock.sendMessage(from, {
 text:
 '𐚁 *PINTEREST STICKER PACK*\n\n' +
 '✐ Usa: *.spack gatos 8*\n' +
 '📦 Máximo: 20 stickers'
 }, { quoted: m })
 }

 let limit = 8
 let q = argsRaw.join(' ')

 const last = argsRaw[argsRaw.length - 1]

 if (/^\d+$/.test(last)) {
 limit = Math.min(
 20,
 Math.max(2, parseInt(last, 10))
 )

 q = argsRaw.slice(0, -1).join(' ') || 'gatos'
 }

 q = q.trim()

 const { botName } = getMyData(sock)

 const packName = `°• ${q} •°`
 const author = botName

 let loading = null

 try {
 loading = await sock.sendMessage(from, {
 text:
 `𐚁 *Pinterest Pack*\n\n` +
 `✐ ${q}\n` +
 `📦 ${limit} stickers\n` +
 `🤖 ${botName}\n\n` +
 `🌀 Descargando imágenes...`
 }, { quoted: m })

 const urls = await searchPinterest(q, limit)

 if (!urls.length) {
 throw new Error('Sin resultados en Pinterest')
 }

 const buffers = []
 const hashes = new Set()

 for (const url of urls) {
 if (buffers.length >= limit) break

 try {
 const buffer = await downloadSticker(url)

 const hash = crypto
 .createHash('sha256')
 .update(buffer)
 .digest('hex')

 // EVITAR STICKERS DUPLICADOS
 if (hashes.has(hash)) continue

 hashes.add(hash)
 buffers.push(buffer)

 console.log(
 `[SPACK] ${buffers.length}/${limit} - ${buffer.length} bytes`
 )

 } catch (e) {
 console.log('[SPACK SKIP]', e.message)
 }
 }

 if (!buffers.length) {
 throw new Error(
 'Pinterest no devolvió imágenes válidas'
 )
 }

 // PORTADA DEL PAQUETE
 const cover = await sharp(buffers[0])
 .resize(96, 96, {
 fit: 'contain',
 background: {
 r: 0,
 g: 0,
 b: 0,
 alpha: 0
 }
 })
 .webp({ quality: 80 })
 .toBuffer()

 const emojis = [
 '🐱', '❤️', '✨', '🌸', '💗',
 '🥰', '💕', '😻', '🌷', '💖'
 ]

 const stickerResults = buffers.map((b, i) => ({
 sticker: b,
 emojis: [emojis[i % emojis.length]],
 accessibilityLabel: `${q} ${i + 1}`
 }))

 console.log(
 `[SPACK] Enviando paquete: ${packName}`
 )

 // PAQUETE NATIVO DEL FORK BAILEYS
 await sock.sendMessage(from, {
 stickerPack: {
 name: packName,
 publisher: author,
 description:
 `Pack de ${q} • ${buffers.length} stickers • ${author}`,
 packId: crypto.randomUUID(),
 cover,
 stickers: stickerResults
 }
 }, { quoted: m })

 console.log(
 `[SPACK] Paquete enviado: ${buffers.length} stickers`
 )

 const finishText =
 `✅ *Pack ${q} listo*\n\n` +
 `📦 ${buffers.length} stickers\n` +
 `🤖 ${author}\n\n` +
 `𐚁 Toca *Ver paquete de stickers* para añadirlos.`

 if (loading?.key) {
 await sock.sendMessage(from, {
 text: finishText,
 edit: loading.key
 }).catch(async () => {
 await sock.sendMessage(from, {
 text: finishText
 }, { quoted: m })
 })
 } else {
 await sock.sendMessage(from, {
 text: finishText
 }, { quoted: m })
 }

 } catch (e) {
 console.error('[SPACK ERROR]', e)

 await sock.sendMessage(from, {
 text: `❌ *Error en Sticker Pack*\n\n${e.message}`
 }, { quoted: m })
 }
}
