import config from '../../config.js'

export const handler = {}
handler.name = 'link'
handler.alias = ['linkgroup', 'enlace']
handler.category = 'Admin'
handler.description = 'Obtiene el link del grupo'

handler.exec = async (sock, m, args, extra) => {
 const jid = m.key.remoteJid
 if (!jid.endsWith('@g.us')) return

 let metadata
 try { metadata = await sock.groupMetadata(jid) } catch { metadata = null }
 if (metadata) {
 let rawSender = m.key.participant || m.participant || ''
 let alt = m.key.participantAlt || m.participantAlt || extra?.senderLid
 let isAdmin = metadata.participants.some(p => {
 let match = p.id === rawSender || p.lid === rawSender || p.phoneNumber === rawSender || (alt && (p.id === alt || p.lid === alt || p.phoneNumber === alt))
 return match && (p.admin === 'admin' || p.admin === 'superadmin')
 })
 if (!isAdmin) return sock.sendMessage(jid, { text: '《✧》 Solo admins.' }, { quoted: m })
 }

 try {
 const code = await sock.groupInviteCode(jid)
 const link = `https://chat.whatsapp.com/${code}`

 await sock.sendMessage(jid, {
 text: `.ೃ🍃࿔ *Aquí tienes el Link del grupo* ฅ^•ﻌ•^ฅ:\n\n${link}`,
 contextInfo: {
 forwardingScore: 999,
 isForwarded: true,
 forwardedNewsletterMessageInfo: {
 newsletterJid: config.channels.id,
 newsletterName: config.channels.cname,
 serverMessageId: -1
 }
 }
 }, { quoted: m })

 await sock.sendMessage(jid, { react: { text: '🔗', key: m.key } }).catch(()=>{})

 } catch (e) {
 await sock.sendMessage(jid, { react: { text: '✖️', key: m.key } }).catch(()=>{})
 await sock.sendMessage(jid, { text: `✖️ No pude sacar el link. Verifica que soy admin.` }, { quoted: m }).catch(()=>{})
 }
}
