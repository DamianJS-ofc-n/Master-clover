import config from '../../config.js'

export const handler = {}
handler.name = 'close'
handler.alias = ['cerrar']
handler.category = 'group'
handler.description = 'Cerrar el grupo solo admins pueden hablar'
handler.admin = true
handler.botAdmin = true
handler.group = true

handler.exec = async (...args) => {
 let sock, m
 if (args[0]?.key) { m = args[0]; sock = args[1]?.conn || global.conn }
 else { sock = args[0]; m = args[1] }

 const jid = m.key.remoteJid
 const metadata = await sock.groupMetadata(jid)

 const senderIds = [m.key.participant, m.key.participantAlt, m.participant].filter(Boolean)
 const senderP = metadata.participants.find(p =>
 senderIds.includes(p.id) || senderIds.includes(p.lid) || senderIds.includes(p.phoneNumber) || senderIds.includes(p.jid)
 )
 const isSenderAdmin = senderP?.admin === 'admin' || senderP?.admin === 'superadmin'

 if (!isSenderAdmin) {
 return sock.sendMessage(jid, { text: '❌ Solo admins' }, { quoted: m })
 }

 try {
 await sock.groupSettingUpdate(jid, 'announcement')
 } catch (e) {
 return sock.sendMessage(jid, { text: '❌ Necesito ser admin. Error: ' + e.message }, { quoted: m })
 }

 await sock.sendMessage(jid, {
 text: '[+] Grupo cerrado',
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
