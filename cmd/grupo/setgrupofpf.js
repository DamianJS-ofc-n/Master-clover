export const handler = {}
handler.name = 'setgrupofpf'
handler.alias = ['setgrupofoto', 'setfoto', 'fotogpo', 'setpfpgroup']
handler.category = 'Admin'

handler.exec = async (sock, m, args) => {
 let jid = m.key.remoteJid
 if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: `《✧》 Solo en grupos.` }, { quoted: m })

 let metadata = await sock.groupMetadata(jid)
 let senderIds = [m.key.participant, m.key.participantAlt, m.participant, m.sender].filter(Boolean)
 let senderP = metadata.participants.find(p => senderIds.includes(p.id) || senderIds.includes(p.lid) || senderIds.includes(p.phoneNumber))
 let isSenderAdmin = senderP && (senderP.admin === 'admin' || senderP.admin === 'superadmin')
 if (!isSenderAdmin) return sock.sendMessage(jid, { text: `《✧》 No eres admin.` }, { quoted: m })

 const ctx = m.message?.extendedTextMessage?.contextInfo
 const quotedMsg = ctx?.quotedMessage
 const quotedStanzaId = ctx?.stanzaId
 const quotedParticipant = ctx?.participant

 let msgToDownload = null
 let isQuoted = false
 if (quotedMsg?.imageMessage) {
 msgToDownload = { key: { remoteJid: jid, id: quotedStanzaId, fromMe: false, participant: quotedParticipant }, message: quotedMsg }
 isQuoted = true
 } else if (m.message?.imageMessage) {
 msgToDownload = m
 } else if (m.quoted?.message?.imageMessage) {
 // algunos handlers ya te dejan m.quoted listo
 msgToDownload = m.quoted
 } else {
 return sock.sendMessage(jid, { text: `《✧》 Responde a una imagen con .setgrupofpf\nO manda una imagen con el caption .setgrupofpf` }, { quoted: m })
 }

 try {
 await sock.sendMessage(jid, { react: { text: '🕒', key: m.key } })

 // 1. Descargar - probar metodo del socket primero
 let buffer = null
 try {
 if (typeof m.download === 'function') buffer = await m.download()
 } catch {}
 if (!buffer) {
 try {
 if (sock.downloadMediaMessage) buffer = await sock.downloadMediaMessage(msgToDownload, 'buffer', {}, { logger: console })
 } catch(e){ console.log('[DL1]', e.message) }
 }
 if (!buffer) {
 try {
 let downloadMediaMessage
 try { ({ downloadMediaMessage } = await import('WhiskeySockets-locosyasociados')) } catch { ({ downloadMediaMessage } = await import('baileys')) }
 // NO pasar reuploadRequest si no existe, eso da el error toString
 buffer = await downloadMediaMessage(msgToDownload, 'buffer', {}, { logger: console, reuploadRequest: sock.updateMediaMessage || undefined })
 } catch(e){ console.log('[DL2]', e.message) }
 }
 if (!buffer || buffer.length === 0) throw new Error('No se pudo descargar la imagen')

 // Asegurar que sea Buffer real, no Uint8Array
 buffer = Buffer.from(buffer)

 // 2. Subir foto - probar los 3 formatos que usa WhiskeySockets
 let ok = false
 let lastErr = null

 // Metodo A: updateProfilePicture(jid, buffer directo)
 try {
 if (sock.updateProfilePicture) {
 await sock.updateProfilePicture(jid, buffer)
 ok = true
 }
 } catch(e){ lastErr = e; console.log('[FOTO A]', e.message) }

 // Metodo B: updateProfilePicture(jid, {img: buffer})
 if (!ok) {
 try {
 await sock.updateProfilePicture(jid, { img: buffer })
 ok = true
 } catch(e){ lastErr = e; console.log('[FOTO B]', e.message) }
 }

 // Metodo C: groupUpdateProfilePicture(jid, buffer)
 if (!ok && sock.groupUpdateProfilePicture) {
 try {
 await sock.groupUpdateProfilePicture(jid, buffer)
 ok = true
 } catch(e){ lastErr = e; console.log('[FOTO C]', e.message) }
 }

 if (!ok) throw lastErr || new Error('Baileys no acepto ningun metodo de foto')

 await sock.sendMessage(jid, { text: `✐ Foto del grupo actualizada.` }, { quoted: m })
 await sock.sendMessage(jid, { react: { text: '✔️', key: m.key } })
 } catch(e){
 console.log('[SETGRUPOFPF]', e)
 await sock.sendMessage(jid, { react: { text: '✖️', key: m.key } })
 await sock.sendMessage(jid, { text: `❌ No pude cambiar la foto: ${e.message}` }, { quoted: m })
 }
}
export default handler
