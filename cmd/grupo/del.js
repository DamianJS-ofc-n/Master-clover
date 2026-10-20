import config from '../../config.js'
export const handler = {}
handler.name = 'del'
handler.alias = ['delete']
handler.category = 'Admin'
handler.description = 'Borrar un mensaje respondido'

handler.exec = async (sock, m, args, extra) => {
 let jid = m.key.remoteJid
 if (!jid.endsWith('@g.us')) return

 let metadata = await sock.groupMetadata(jid)
 let rawSender = m.key.participant || m.participant || m.key.remoteJid
 let alt = m.key.participantAlt || m.participantAlt || extra?.senderLid
 let isAdmin = metadata.participants.some(p => {
 let match = p.id === rawSender || p.lid === rawSender || p.phoneNumber === rawSender || (alt && (p.id === alt || p.lid === alt || p.phoneNumber === alt))
 return match && (p.admin === 'admin' || p.admin === 'superadmin')
 })
 if (!isAdmin) return sock.sendMessage(jid, { text: '《✧》 Solo admins pueden usar este comando idiota 😑.' }, { quoted: m })

 let ctx = m.message?.extendedTextMessage?.contextInfo
 let q = m.quoted
 if (!ctx?.stanzaId && !q) return sock.sendMessage(jid, { text: '[x] Responde a un mensaje para borrarlo.', contextInfo:{ forwardingScore:999, isForwarded:true, forwardedNewsletterMessageInfo:{ newsletterJid:config.channels.id, newsletterName:config.channels.cname, serverMessageId:-1 } } }, { quoted: m })
 
 let key = {
 remoteJid: jid,
 fromMe: ctx?.fromMe || q?.fromMe || false,
 id: ctx?.stanzaId || q?.id,
 participant: ctx?.participant || q?.participant || q?.sender
 }
 try {
 await sock.sendMessage(jid, { delete: key })
 } catch (e) {
 await sock.sendMessage(jid, { text: '《✧》 Necesito ser admin para borrar mensajes pendejo 🙄.' }, { quoted: m })
 }
}
