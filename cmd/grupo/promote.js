import config from '../../config.js'
export const handler = {}
handler.name = 'promote'
handler.alias = ['daradmin', 'darpene']
handler.category = 'admin'

handler.exec = async (...args) => {
 let sock, m, a
 if (args[0]?.key) { m = args[0]; sock = args[1]?.conn || global.conn; a = args[1]?.args || [] }
 else { sock = args[0]; m = args[1]; a = args[2] || [] }

 let jid = m.key.remoteJid
 if (!jid.endsWith('@g.us')) return
 let metadata = await sock.groupMetadata(jid)
 let senderIds = [m.key.participant, m.key.participantAlt, m.participant].filter(Boolean)
 let isSenderAdmin = metadata.participants.some(p =>
 (senderIds.includes(p.id) || senderIds.includes(p.lid) || senderIds.includes(p.phoneNumber)) && (p.admin === 'admin' || p.admin === 'superadmin')
 )
 if (!isSenderAdmin) return sock.sendMessage(jid, { text: '《✧》 Solo admins.' }, { quoted: m })

 let info = m.message?.extendedTextMessage?.contextInfo || {}
 let who = m.mentionedJid?.[0] || info.mentionedJid?.[0] || info.participant || m.quoted?.sender || null
 if (!who && a[0]) {
 let n = a[0].replace(/[^0-9]/g,'')
 if (n.length >= 8) who = n + '@s.whatsapp.net'
 }
 if (!who) return sock.sendMessage(jid, { text: '《✧》 Debes etiquetar o responder al usuario para dar admin.' }, { quoted: m })

 try {
 await sock.groupParticipantsUpdate(jid, [who], 'promote')
 await sock.sendMessage(jid, { text: `✐ Se ha dado admin a @${who.split('@')[0]}`, mentions: [who] }, { quoted: m })
 } catch(e){ await sock.sendMessage(jid, { text: `❌ Error: ${e.message}` }, { quoted: m }) }
}