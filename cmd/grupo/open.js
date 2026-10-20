import config from '../../config.js'
export const handler = {}
handler.name = 'open'
handler.alias = ['abrir']
handler.category = 'Admin'
handler.description = 'Abrir el grupo para que todos hablen'

handler.exec = async (...args) => {
 let sock, m, extra
 if (args[0]?.key) { m = args[0]; sock = args[1]?.conn || global.conn; extra = args[1] }
 else { sock = args[0]; m = args[1]; extra = args[3] }

 const jid = m.key.remoteJid
 if (!jid.endsWith('@g.us')) return
 const metadata = await sock.groupMetadata(jid)
 const senderIds = [m.key.participant, m.participant, m.key.participantAlt, m.participantAlt, extra?.senderLid].filter(Boolean)
 const senderP = metadata.participants.find(p => senderIds.includes(p.id) || senderIds.includes(p.lid) || senderIds.includes(p.phoneNumber))
 const isSenderAdmin = senderP?.admin === 'admin' || senderP?.admin === 'superadmin'

 if (!isSenderAdmin) return sock.sendMessage(jid, { text: '❌ Solo admins' }, { quoted: m })

 try {
 await sock.groupSettingUpdate(jid, 'not_announcement')
 } catch(e) {
 return sock.sendMessage(jid, { text: '⛔ No se pudo abrir porque no soy admin pendejo y de paso ya está abierto 🙄' }, { quoted: m })
 }
 await sock.sendMessage(jid, { text: '🌀 Grupo abierto, ¡Que comienze la fiesta! 🎉', contextInfo:{ forwardingScore:999, isForwarded:true, forwardedNewsletterMessageInfo:{ newsletterJid:config.channels.id, newsletterName:config.channels.cname, serverMessageId:-1 } } }, { quoted: m })
}
