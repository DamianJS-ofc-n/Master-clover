import config from '../../config.js'
export const handler = {}
handler.name = 'warn'
handler.alias = ['advertir']
handler.category = 'Admin'

handler.exec = async (...args) => {
 let sock, m, a, extra
 if (args[0]?.key) { m = args[0]; sock = args[1]?.conn || global.conn; a = args[1]?.args || []; extra = args[1] }
 else { sock = args[0]; m = args[1]; a = args[2] || []; extra = args[3] }

 let jid = m.key.remoteJid
 if (!jid.endsWith('@g.us')) return
 let metadata = await sock.groupMetadata(jid)

 let rawSender = m.key.participant || m.participant || ''
 let alt = m.key.participantAlt || m.participantAlt || extra?.senderLid

 let isAdmin = metadata.participants.some(p => {
 let match = p.id === rawSender || p.lid === rawSender || p.phoneNumber === rawSender || (alt && (p.id === alt || p.lid === alt || p.phoneNumber === alt))
 let admin = p.admin === 'admin' || p.admin === 'superadmin'
 return match && admin
 })

 if (!isAdmin) return sock.sendMessage(jid, { text: '《✧》 Solo admins.' }, { quoted: m })

 let info = m.message?.extendedTextMessage?.contextInfo || {}
 let who = m.mentionedJid?.[0] || info.mentionedJid?.[0] || info.participant || m.quoted?.sender || null
 let textArgs = (a.args || a).filter(x=>!String(x).includes('@'))
 let razon = textArgs.join(' ') || 'Sin razon.'

 if (!who) {
 let txt = m.message?.extendedTextMessage?.text || ""
 let num = txt.match(/@(\d+)/)
 if (num) who = num[1] + '@s.whatsapp.net'
 }
 if (!who) return sock.sendMessage(jid, { text: '《✧》 Debes etiquetar o responder al usuario para advertir.' }, { quoted: m })

 if (who.endsWith('@lid')) {
 let f = metadata.participants.find(p => p.lid === who || p.id === who)
 if (f?.phoneNumber) who = f.phoneNumber
 }

 if (!global.db.data.users[who]) global.db.data.users[who] = {}
 if (!global.db.data.users[who].warns) global.db.data.users[who].warns = []
 let fecha = new Date().toLocaleString('es-PE', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
 global.db.data.users[who].warns.push({ razon, fecha, by: rawSender })
 let total = global.db.data.users[who].warns.length
 let lista = global.db.data.users[who].warns.map((w,i) => `\`#${i+1}\` » ${w.razon}\n> » Fecha: ${w.fecha}`).join('\n\n')
 if (total >= 3) {
 await sock.sendMessage(jid, { text: `✐ Se ha añadido una advertencia a @${who.split('@')[0]}\n❖ Advertencias totales \`(${total})\`:\n\n${lista}\n\n> ✧ Limite alcanzado, eliminando...`, mentions: [who] }, { quoted: m })
 global.db.data.users[who].warns = []
 try{ await sock.groupParticipantsUpdate(jid, [who], 'remove') }catch{}
 } else {
 await sock.sendMessage(jid, { text: `✐ Se ha añadido una advertencia a @${who.split('@')[0]}\n❖ Advertencias totales \`(${total})\`:\n\n${lista}`, mentions: [who] }, { quoted: m })
 }
 extra?.saveDB?.(); global.saveDB?.()
}
