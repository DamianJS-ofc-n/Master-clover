import fs from 'fs/promises'
import axios from 'axios'
import config from '../../config.js'

const FILE_PATH = './core/characters.json'
const rollLocks = new Map()
function cleanOldLocks() {
 const now = Date.now()
 for (const [userId, lockTime] of rollLocks.entries()) {
 if (now - lockTime > 30000) rollLocks.delete(userId)
 }
}

async function loadCharacters() {
 try { await fs.access(FILE_PATH) } catch { await fs.writeFile(FILE_PATH, '{}') }
 const raw = await fs.readFile(FILE_PATH, 'utf-8')
 return JSON.parse(raw)
}
function flattenCharacters(chars) {
 return Object.values(chars).flatMap(s => Array.isArray(s.characters)? s.characters : [])
}
function getSeriesNameByCharacter(chars, id) {
 return Object.entries(chars).find(([, serie]) => Array.isArray(serie.characters) && serie.characters.some(c => String(c.id) === String(id)))?.[1]?.name || 'Desconocido'
}
function formatTag(tag) { return String(tag).trim().toLowerCase().replace(/\s+/g, '_') }
function getRefererForUrl(url) {
 if (url.includes('safebooru.org')) return 'https://safebooru.org/'
 if (url.includes('danbooru.donmai.us')) return 'https://danbooru.donmai.us/'
 if (url.includes('gelbooru.com')) return 'https://gelbooru.com/'
 return ''
}
async function buscarImagenDelirius(tag) {
 const query = formatTag(tag)
 const urls = [`https://safebooru.org/index.php?page=dapi&s=post&q=index&json=1&tags=${query}`, `https://danbooru.donmai.us/posts.json?tags=${query}`, `https://gelbooru.com/index.php?page=dapi&s=post&q=index&json=1&tags=${query}&api_key=98f554258c88c44f4dd28ccde0c28f36682b2a992490ab35ebcc7baf7e196a86d7550b174bce577b8cc3f544e9b3ad0f6aeb09ad63bf89a9141cc3eddb6fbfd2&user_id=1917269`]
 for (const url of urls) {
 try {
 const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } })
 const type = res.headers.get('content-type') || ''
 if (!res.ok ||!type.includes('json')) continue
 const json = await res.json()
 const data = Array.isArray(json)? json?.post || json?.data || [] : json?.post || json?.data || []
 const valid = data.map(i => i?.file_url || i?.large_file_url || i?.image || i?.media_asset?.variants?.[0]?.url).filter(u => typeof u === 'string' && /\.(jpe?g|png)$/.test(u))
 if (valid.length) return valid
 } catch {}
 }
 return []
}

export const handler = {}
handler.name = 'rollwaifu'
handler.alias = ['rw', 'roll']
handler.category = 'gacha'
handler.description = 'Waifu o husbando aleatorio'

handler.exec = async (sock, m, args, extra) => {
 const chatId = m.key.remoteJid
 const userId = m.key.participant || m.key.remoteJid
 const usedPrefix = extra?.usedPrefix || '.'
 cleanOldLocks()
 if (rollLocks.has(userId)) {
 const lockTime = rollLocks.get(userId)
 if (Date.now() - lockTime < 15000) return
 rollLocks.delete(userId)
 }

 let db = global.db?.data || {}
 if (!db.chats) db.chats = {}
 if (!db.chats[chatId]) db.chats[chatId] = { rolls: {} }
 if (!db.chats[chatId].rolls) db.chats[chatId].rolls = {}
 let chat = db.chats[chatId]

 if (chat.adminonly || chat.gacha === false) {
 return sock.sendMessage(chatId, { text: `ꕥ Los comandos de *Gacha* están desactivados en este grupo.\n\nUn *administrador* puede activarlos con:\n» *${usedPrefix}gacha on*` }, { quoted: m })
 }

 if (!db.chat_users) db.chat_users = {}
 if (!db.chat_users[chatId]) db.chat_users[chatId] = {}
 if (!db.chat_users[chatId][userId]) db.chat_users[chatId][userId] = { lastRoll: 0 }
 let user = db.chat_users[chatId][userId]

 const now = Date.now()
 const cooldown = 15 * 60 * 1000
 if (user.lastRoll && now < user.lastRoll) {
 const r = Math.ceil((user.lastRoll - now) / 1000)
 const min = Math.floor(r / 60)
 const sec = r % 60
 let timeText = ''
 if (min > 0) timeText += `${min} minuto${min!== 1? 's' : ''} `
 if (sec > 0 || timeText === '') timeText += `${sec} segundo${sec!== 1? 's' : ''}`
 return sock.sendMessage(chatId, { text: `ꕥ Debes esperar *${timeText.trim()}* para usar *${usedPrefix}rw* de nuevo.` }, { quoted: m })
 }

 rollLocks.set(userId, now)
 try {
 const chars = await loadCharacters()
 const all = flattenCharacters(chars)
 const selected = all[Math.floor(Math.random() * all.length)]
 const id = String(selected.id)
 const source = getSeriesNameByCharacter(chars, selected.id)
 const baseTag = formatTag(selected.tags?.[0] || selected.name || '')
 const mediaList = await buscarImagenDelirius(baseTag)
 const media = mediaList[Math.floor(Math.random() * mediaList.length)]
 if (!media) {
 rollLocks.delete(userId)
 return sock.sendMessage(chatId, { text: `ꕥ No se encontró imágenes para *${selected.name}*.` }, { quoted: m })
 }

 const charKey = chatId + '__' + id
 if (!db.characters) db.characters = {}
 let chatChar = db.characters[charKey] || {}
 chatChar.name = String(selected.name || 'Sin nombre')
 chatChar.value = typeof chatChar.value === 'number'? chatChar.value : Number(selected.value) || 100
 chatChar.votes = Number(chatChar.votes || 0)
 chatChar.reservedBy = userId
 chatChar.reservedUntil = now + 20000
 chatChar.expiresAt = now + 60000
 db.characters[charKey] = chatChar

 const caption = `❀ Nombre » *${chatChar.name}*\n⚥ Género » *${selected.gender || 'Desconocido'}*\n✰ Valor » *${chatChar.value.toLocaleString()}*\n♡ Estado » *Libre*\n❖ Fuente » *${source}*`

 const imgRes = await axios.get(media, { responseType: 'arraybuffer', timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': getRefererForUrl(media) } })
 const buffer = Buffer.from(imgRes.data)
 const sent = await sock.sendMessage(chatId, { image: buffer, caption: caption }, { quoted: m })

 chat.rolls[sent.key.id] = { id, charKey, name: chatChar.name, expiresAt: chatChar.expiresAt, reservedBy: userId, reservedUntil: chatChar.reservedUntil }
 user.lastRoll = now + cooldown
 extra?.saveDB?.(); global.saveDB?.()
 } catch (e) {
 await sock.sendMessage(chatId, { text: `> Error en rw: ${e.message}` }, { quoted: m })
 } finally {
 rollLocks.delete(userId)
 }
}
