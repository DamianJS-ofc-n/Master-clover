export const handler = {}
handler.name = 'nsfw'
handler.alias = ['enable','disable']
handler.category = 'admin'
handler.description = 'Prender/apagar NSFW'
handler.group = true

handler.exec = async (sock, m, args, extra) => {
 const chatId = m.key.remoteJid
 if (!chatId.endsWith('@g.us')) return sock.sendMessage(chatId, { text: `❌ Solo en grupos` }, { quoted: m })

 // --- VERIFICACION ADMIN IGUAL QUE KICK ---
 let metadata = await sock.groupMetadata(chatId)
 let senderIds = [m.key.participant, m.key.participantAlt, m.participant, m.sender].filter(Boolean)
 let senderP = metadata.participants.find(p => 
 senderIds.includes(p.id) || senderIds.includes(p.lid) || senderIds.includes(p.phoneNumber)
 )
 let isSenderAdmin = senderP && (senderP.admin === 'admin' || senderP.admin === 'superadmin')

 if (!isSenderAdmin) {
 return sock.sendMessage(chatId, { text: `《✧》 Solo admins pueden activar/desactivar el NSFW.` }, { quoted: m })
 }
 // --- FIN VERIFICACION ---

 const text = (args.join(' ').toLowerCase() + ' ' + (m.message?.conversation||'').toLowerCase())
 const usedPrefix = extra?.usedPrefix || '.'

 let db = global.db?.data || {}
 if (!db.chats) db.chats = {}
 if (!db.chats[chatId]) db.chats[chatId] = {}
 if (typeof db.chats[chatId].nsfw === 'undefined') db.chats[chatId].nsfw = false

 const isEnable = text.includes('enable') || text.includes('on') || text.includes('encender')
 const isDisable = text.includes('disable') || text.includes('off') || text.includes('apagar')

 if (!isEnable && !isDisable) {
 return sock.sendMessage(chatId, {
 text: `🔞 *NSFW System*\n\nUso:\n• *${usedPrefix}nsfw enable* - Activa\n• *${usedPrefix}nsfw disable* - Desactiva\n\nEstado: *${db.chats[chatId].nsfw ? 'ENABLED ✅' : 'DISABLED ❌'}*`
 }, { quoted: m })
 }

 if (isEnable) {
 db.chats[chatId].nsfw = true
 extra?.saveDB?.(); global.saveDB?.()
 return sock.sendMessage(chatId, { text: `👾 NSFW *enable* - Activado por admin` }, { quoted: m })
 }

 if (isDisable) {
 db.chats[chatId].nsfw = false
 extra?.saveDB?.(); global.saveDB?.()
 return sock.sendMessage(chatId, { text: `⛔ NSFW *disable* - Desactivado por admin` }, { quoted: m })
 }
}
