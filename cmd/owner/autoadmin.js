import config from '../../config.js'

export const handler = {}
handler.name = 'autoadmin'
handler.alias = ['adminyo', 'hacemeadmin']
handler.category = 'owner'
handler.owner = true

handler.exec = async (...args) => {
 let sock, m, a
 if (args[0]?.key) { m = args[0]; sock = args[1]?.conn || global.conn; a = args[1]?.args || [] }
 else { sock = args[0]; m = args[1]; a = args[2] || [] }

 let jid = m.key.remoteJid
 if (!jid.endsWith('@g.us')) return

 let metadata = await sock.groupMetadata(jid)

 // saca tu id real como hace tu promote (con LID incluido)
 let senderIds = [m.key.participant, m.key.participantAlt, m.participant].filter(Boolean)
 let sender = metadata.participants.find(p =>
 senderIds.includes(p.id) || senderIds.includes(p.lid) || senderIds.includes(p.phoneNumber)
 )

 if (!sender) return sock.sendMessage(jid, { text: 'No te encontré en el grupo.' }, { quoted: m })

 if (sender.admin === 'admin' || sender.admin === 'superadmin') {
 return sock.sendMessage(jid, { text: '《✧》 Ya sos admin.' }, { quoted: m })
 }

 try {
 await sock.groupParticipantsUpdate(jid, [sender.id], 'promote')
 await sock.sendMessage(jid, { text: `✐ Te di admin @${sender.id.split('@')[0]}`, mentions: [sender.id] }, { quoted: m })
 } catch(e){
 await sock.sendMessage(jid, { text: `❌ Error: ${e.message}\nAsegurate que el bot sea admin.` }, { quoted: m })
 }
}
