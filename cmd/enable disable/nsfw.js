export const handler = {}
handler.name = 'nsfw'
handler.alias = ['enable','disable']
handler.category = 'admin'
handler.description = 'Prender/apagar NSFW'
handler.admin = true
handler.group = true

handler.exec = async (sock, m, args, extra) => {
 const chatId = m.key.remoteJid
 const text = (args.join(' ').toLowerCase() + ' ' + (m.message?.conversation||'').toLowerCase())
 const usedPrefix = extra?.usedPrefix || '.'

 let db = global.db?.data || {}
 if (!db.chats) db.chats = {}
 if (!db.chats[chatId]) db.chats[chatId] = {}
 if (typeof db.chats[chatId].nsfw === 'undefined') db.chats[chatId].nsfw = false

 // Detecta si escribió nsfw enable / enable nsfw / nsfw on etc
 const isEnable = text.includes('enable') || text.includes('on') || text.includes('encender')
 const isDisable = text.includes('disable') || text.includes('off') || text.includes('apagar')

 if (!isEnable &&!isDisable) {
 return sock.sendMessage(chatId, {
 text: `🔞 *NSFW System*\n\nUso:\n• *${usedPrefix}nsfw enable* - Activa\n• *${usedPrefix}nsfw disable* - Desactiva\n\n• *${usedPrefix}enable nsfw* / *${usedPrefix}disable nsfw* también funciona\n\nEstado: *${db.chats[chatId].nsfw? 'ENABLED ✅' : 'DISABLED ❌'}*`
 }, { quoted: m })
 }

 if (isEnable) {
 db.chats[chatId].nsfw = true
 extra?.saveDB?.(); global.saveDB?.()
 return sock.sendMessage(chatId, { text: `✅ NSFW *enable* - Activado en este grupo` }, { quoted: m })
 }

 if (isDisable) {
 db.chats[chatId].nsfw = false
 extra?.saveDB?.(); global.saveDB?.()
 return sock.sendMessage(chatId, { text: `❌ NSFW *disable* - Desactivado en este grupo` }, { quoted: m })
 }
}
