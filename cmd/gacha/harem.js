import fs from 'fs/promises'
import config from '../../config.js'

const charactersFilePath = './core/characters.json'
async function loadCharacters() {
 const d = await fs.readFile(charactersFilePath, 'utf-8')
 return JSON.parse(d)
}
function flattenCharacters(s) { return Object.values(s).flatMap(v => Array.isArray(v.characters)? v.characters : []) }

export const handler = {}
handler.name = 'harem'
handler.alias = ['waifus', 'claims']
handler.category = 'gacha'
handler.description = 'Ver tus personajes reclamados'

handler.exec = async (sock, m, args, extra) => {
 const chatId = m.key.remoteJid
 const ctx = m.message?.extendedTextMessage?.contextInfo || {}
 const mentioned = m.mentionedJid?.[0] || ctx.mentionedJid?.[0] || null
 const quoted = ctx.participant || null
 const sender = m.key.participant || m.key.remoteJid
 const userId = mentioned || quoted || sender

 let db = global.db?.data || {}
 if (!db.chats) db.chats = {}
 if (!db.chats[chatId]) db.chats[chatId] = { rolls: {} }
 let chat = db.chats[chatId]
 if (!db.chat_users) db.chat_users = {}
 if (!db.chat_users[chatId]) db.chat_users[chatId] = {}

 let displayName = m.pushName || 'Usuario'
 if (mentioned) {
 const targetDb = db.users?.[userId] || db.chat_users?.[chatId]?.[userId]
 displayName = targetDb?.name || `@${userId.split('@')[0]}`
 } else if (quoted) {
 displayName = `@${userId.split('@')[0]}`
 }

 let userData = db.chat_users[chatId][userId] || { characters: [] }
 let ownedIDs = Array.isArray(userData.characters)? userData.characters : []
 if (ownedIDs.length === 0) {
 const txt = mentioned || quoted? `ꕥ *${displayName}* no tiene personajes reclamados.` : 'ꕥ No tienes personajes reclamados.'
 return sock.sendMessage(chatId, { text: txt, mentions: [userId] }, { quoted: m })
 }

 const structure = await loadCharacters()
 const allCharacters = flattenCharacters(structure)
 const withValues = ownedIDs.map(id => {
 const g = db.characters?.[id]
 const c = db.characters?.[chatId + '__' + id]
 return { id, value: typeof g?.value === 'number'? g.value : c?.value || 0 }
 }).sort((a,b)=>b.value-a.value)

 const sortedIDs = withValues.map(i=>i.id)
 const page = parseInt(args.args?.[0] || args[0]) || 1
 const perPage = 64
 const totalPages = Math.ceil(sortedIDs.length / perPage)
 let message = `✿ Personajes reclamados ✿\n⌦ Usuario: *${displayName}*\n♡ Personajes: *(${sortedIDs.length})*\n\n`
 const start = (page-1)*perPage
 const end = Math.min(start+perPage, sortedIDs.length)
 for(let i=start;i<end;i++){
 const id = sortedIDs[i]
 const g = db.characters?.[id]
 const c = db.characters?.[chatId + '__' + id]
 const jsonRec = allCharacters.find(x=>String(x.id)===String(id))
 const name = jsonRec?.name || c?.name || g?.name || `ID:${id}`
 const val = typeof g?.value === 'number'? g.value : c?.value || 0
 message += `» *${name}* (*${val.toLocaleString()}*)\n`
 }
 message += `\n⌦ _Página *${page}* de *${totalPages}*_`
 await sock.sendMessage(chatId, { text: message.trim(), mentions: mentioned || quoted? [userId] : [] }, { quoted: m })
}
