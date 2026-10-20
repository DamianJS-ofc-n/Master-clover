export const handler = {}
handler.name = 'kick'
handler.alias = ['k']
handler.category = 'Admin'

handler.exec = async (sock, m, args) => {
 let jid = m.key.remoteJid
 if (!jid.endsWith('@g.us')) return

 let metadata = await sock.groupMetadata(jid)
 let participants = metadata.participants
 let sender = m.key.participant || m.participant || ''

 // check sender admin por LID
 let senderP = participants.find(p => p.id === sender)
 let isSenderAdmin = senderP && (senderP.admin === 'admin' || senderP.admin === 'superadmin')

 if (!isSenderAdmin) {
 return sock.sendMessage(jid, { text: `《✧》 No eres admin. Tu ID: ${sender}\nAdmin detectado: ${senderP?.admin || 'null'}` }, { quoted: m })
 }

 let info = m.message?.extendedTextMessage?.contextInfo || {}
 let who = m.mentionedJid?.[0] || info.mentionedJid?.[0] || info.participant || m.quoted?.sender || null

 if (!who && args[0]) {
 let n = args[0].replace(/[^0-9]/g,'')
 if (n.length >= 8) who = n + '@s.whatsapp.net'
 }
 if (!who) return sock.sendMessage(jid, { text: 'Etiqueta a alguien' }, { quoted: m })

 // si es LID lo dejamos como viene
 try {
 await sock.groupParticipantsUpdate(jid, [who], 'remove')
 await sock.sendMessage(jid, { text: `✐ Expulsado @${who.split('@')[0]}`, mentions: [who] }, { quoted: m })
 } catch(e){
 console.log(e)
 // si falla por no ser admin, ahí si avisamos
 await sock.sendMessage(jid, { text: `❌ No pude expulsar. Error: ${e.message}\n\nSi dice not-authorized es que el bot no es admin o el cache está viejo. Saca al bot y vuelve a meterlo como admin.` }, { quoted: m })
 }
}
