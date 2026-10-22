export const handler = {}
handler.name = 'kick'
handler.alias = ['k']
handler.category = 'Admin'

handler.exec = async (sock, m, args) => {
 let jid = m.key.remoteJid
 if (!jid.endsWith('@g.us')) return

 let metadata = await sock.groupMetadata(jid)
 
 let senderIds = [m.key.participant, m.key.participantAlt, m.participant, m.sender].filter(Boolean)
 let senderP = metadata.participants.find(p => 
 senderIds.includes(p.id) || senderIds.includes(p.lid) || senderIds.includes(p.phoneNumber)
 )
 let isSenderAdmin = senderP && (senderP.admin === 'admin' || senderP.admin === 'superadmin')

 if (!isSenderAdmin) {
 return sock.sendMessage(jid, { text: `《✧》 No eres admin.` }, { quoted: m })
 }

 let info = m.message?.extendedTextMessage?.contextInfo || {}
 let who = m.mentionedJid?.[0] || info.mentionedJid?.[0] || info.participant || m.quoted?.sender || null

 if (!who && args[0]) {
 let n = args[0].replace(/[^0-9]/g,'')
 if (n.length >= 8) who = n + '@s.whatsapp.net'
 }
 if (!who) return sock.sendMessage(jid, { text: 'Etiqueta a alguien' }, { quoted: m })

 try {
 await sock.groupParticipantsUpdate(jid, [who], 'remove')
 await sock.sendMessage(jid, { text: `✐ Expulsado @${who.split('@')[0]}`, mentions: [who] }, { quoted: m })
 } catch(e){
 await sock.sendMessage(jid, { text: `❌ No pude expulsar: ${e.message}` }, { quoted: m })
 }
}
