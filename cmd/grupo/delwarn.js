import config from '../../config.js'
export const handler = {}
handler.name = 'delwarn'
handler.alias = ['unwarn']
handler.category = 'Admin'
handler.description = 'Eliminar advertencias de un usuario'

handler.exec = async (sock, m, args, extra) => {
 let jid = m.key.remoteJid
 if (!jid.endsWith('@g.us')) return

 // check admin real
 let metadata = await sock.groupMetadata(jid)
 let rawSender = m.key.participant || m.participant || ''
 let alt = m.key.participantAlt || m.participantAlt || extra?.senderLid
 let isAdmin = metadata.participants.some(p => {
 let match = p.id === rawSender || p.lid === rawSender || p.phoneNumber === rawSender || (alt && (p.id === alt || p.lid === alt || p.phoneNumber === alt))
 return match && (p.admin === 'admin' || p.admin === 'superadmin')
 })
 if (!isAdmin) return sock.sendMessage(jid, { text: '《✧》 Solo admins.' }, { quoted: m })

 let info = m.message?.extendedTextMessage?.contextInfo || {}
 let who = m.mentionedJid?.[0] || info.mentionedJid?.[0] || info.participant || m.quoted?.sender || null
 
 if (!who) {
 let txt = m.message?.extendedTextMessage?.text || ""
 let num = txt.match(/@(\d+)/)
 if (num) who = num[1] + '@s.whatsapp.net'
 }
 if (!who) return sock.sendMessage(jid, { text: '《✧》 Debes etiquetar o responder al usuario.' }, { quoted: m })

 if (who.endsWith('@lid')) {
 let f = metadata.participants.find(p => p.lid === who || p.id === who)
 if (f?.phoneNumber) who = f.phoneNumber
 }

 if (global.db.data.users[who]) global.db.data.users[who].warns = []
 extra?.saveDB?.(); global.saveDB?.()
 await sock.sendMessage(jid, { text: `✐ Advertencias de @${who.split('@')[0]} eliminadas`, mentions: [who], contextInfo:{ forwardingScore:999, isForwarded:true, forwardedNewsletterMessageInfo:{ newsletterJid:config.channels.id, newsletterName:config.channels.cname, serverMessageId:-1 } } }, { quoted: m })
}
