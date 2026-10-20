import config from '../../config.js'
export const handler = {}
handler.name = 'demote'
handler.alias = ['degradar', 'quitaradmin']
handler.category = 'Admin'

handler.exec = async (...args) => {
 let sock, m, a, extra
 if (args[0]?.key) { m = args[0]; sock = args[1]?.conn || global.conn; a = args[1]?.args || []; extra = args[1] }
 else { sock = args[0]; m = args[1]; a = args[2] || []; extra = args[3] }

 let jid = m.key.remoteJid
 if (!jid.endsWith('@g.us')) return
 let metadata = await sock.groupMetadata(jid)
 let senderIds = [m.key.participant, m.key.participantAlt, m.participant, extra?.senderLid].filter(Boolean)
 let isSenderAdmin = metadata.participants.some(p =>
 (senderIds.includes(p.id) || senderIds.includes(p.lid) || senderIds.includes(p.phoneNumber)) && (p.admin === 'admin' || p.admin === 'superadmin')
 )
 if (!isSenderAdmin) return sock.sendMessage(jid, { text: '《✧》 Solo admins.' }, { quoted: m })

 let info = m.message?.extendedTextMessage?.contextInfo || {}
 let who = m.mentionedJid?.[0] || info.mentionedJid?.[0] || info.participant || m.quoted?.sender || null
 if (!who && a[0]) {
 let n = String(a[0]).replace(/[^0-9]/g,'')
 if (n.length >= 8) who = n + '@s.whatsapp.net'
 }
 if (!who) return sock.sendMessage(jid, { text: '《✧》 Debes etiquetar o responder al usuario para quitar admin.' }, { quoted: m })

 if (who.endsWith('@lid')) {
 let f = metadata.participants.find(p => p.lid === who || p.id === who)
 if (f?.phoneNumber) who = f.phoneNumber
 }

 try {
 await sock.groupParticipantsUpdate(jid, [who], 'demote')
 await sock.sendMessage(jid, { text: `✐ Se ha quitado el admin a @${who.split('@')[0]}`, mentions: [who] }, { quoted: m })
 } catch(e){
 let msg = e.message?.includes('not-authorized') || e.message?.includes('forbidden') ? '《✧》 Necesito ser admin para quitar admins.' : `❌ Error: ${e.message}`
 await sock.sendMessage(jid, { text: msg }, { quoted: m })
 }
}
