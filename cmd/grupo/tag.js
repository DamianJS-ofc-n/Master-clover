import config from '../../config.js'

export const handler = {}
handler.name = 'tag'
handler.alias = ['hidetag']
handler.category = 'group'
handler.description = 'Mencionar a todos los miembros del grupo'
handler.admin = true
handler.group = true

handler.exec = async (...args) => {
 let sock, m, a
 if (args[0]?.key) { m = args[0]; sock = args[1]?.conn || global.conn; a = args[1]?.args || [] }
 else { sock = args[0]; m = args[1]; a = args[2] || [] }

 let jid = m.key.remoteJid
 let meta = await sock.groupMetadata(jid)

 // FIX ADMIN LID
 const senderIds = [m.key.participant, m.key.participantAlt, m.participant].filter(Boolean)
 const senderP = meta.participants.find(p => senderIds.includes(p.id) || senderIds.includes(p.lid) || senderIds.includes(p.phoneNumber))
 if (!(senderP?.admin === 'admin' || senderP?.admin === 'superadmin')) {
 return sock.sendMessage(jid, { text: '《✧》 Solo admins.' }, { quoted: m })
 }

 let participants = meta.participants.map(p => p.id).filter(Boolean)
 let texto = a.join(' ')
 if (!texto) return sock.sendMessage(jid, { text: '《✧》 Debes enviar un texto para hacer un tag.', contextInfo:{ forwardingScore:999, isForwarded:true, forwardedNewsletterMessageInfo:{ newsletterJid:config.channels.id, newsletterName:config.channels.cname, serverMessageId:-1 } } }, { quoted: m })

 await sock.sendMessage(jid, { 
 text: texto, 
 mentions: participants, 
 contextInfo:{
 forwardingScore:999, 
 isForwarded:true, 
 forwardedNewsletterMessageInfo:{
 newsletterJid:config.channels.id, 
 newsletterName:config.channels.cname, 
 serverMessageId:-1 
 } 
 } 
 }, { quoted: m })
}
