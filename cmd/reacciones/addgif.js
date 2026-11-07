import { isStaffOrOwner, agregarGif, normalizarCmd, listarGifs } from '../../lib/gifs.js'

export const handler = {}
handler.name = 'addgif'
handler.alias = ['addgif', 'agif']
handler.category = 'reacciones'

handler.exec = async (sock, m, a) => {
 const jid = m.key.remoteJid
 if(!isStaffOrOwner(m)) return sock.sendMessage(jid, { text: '⚠️ Solo staff y owners pueden agregar gifs' }, { quoted: m })

 let cmd = normalizarCmd(a[0] || '')
 if(!cmd) return sock.sendMessage(jid, { text: '❀ Uso: responde a un GIF o video corto con\n.addgif abrazo' }, { quoted: m })

 const ctx = m.message?.extendedTextMessage?.contextInfo
 const quotedMsg = ctx?.quotedMessage
 const quotedStanzaId = ctx?.stanzaId
 const quotedParticipant = ctx?.participant

 let msgToDownload = null
 let videoMsg = null

 if (quotedMsg?.videoMessage) {
 videoMsg = quotedMsg.videoMessage
 msgToDownload = { key: { remoteJid: jid, id: quotedStanzaId, fromMe: false, participant: quotedParticipant }, message: quotedMsg }
 } else if (m.message?.videoMessage) {
 videoMsg = m.message.videoMessage
 msgToDownload = m
 } else {
 if (quotedMsg?.imageMessage || m.message?.imageMessage) return sock.sendMessage(jid, { text: '⚠️ Eso es una foto, solo se permiten GIFs o videos cortos' }, { quoted: m })
 if (quotedMsg?.stickerMessage || m.message?.stickerMessage) return sock.sendMessage(jid, { text: '⚠️ Eso es un sticker, solo se permiten GIFs o videos cortos' }, { quoted: m })
 return sock.sendMessage(jid, { text: '⚠️ Tenés que responder a un GIF o video corto' }, { quoted: m })
 }

 // solo videos cortos como gifs, max 10 seg
 let segundos = videoMsg.seconds || 0
 // si es GIF de WhatsApp (gifPlayback) siempre es corto, lo dejamos pasar
 if(!videoMsg.gifPlayback && segundos > 10){
 return sock.sendMessage(jid, { text: `⚠️ Video muy largo (${segundos}s)\nSolo se permiten videos de hasta 10s, como un GIF` }, { quoted: m })
 }

 try {
 let downloadMediaMessage
 try { ({ downloadMediaMessage } = await import('baileys')) } catch { ({ downloadMediaMessage } = await import('WhiskeySockets-locosyasociados')) }

 const buffer = await downloadMediaMessage(msgToDownload, 'buffer', {}, { logger: console, reuploadRequest: sock.updateMediaMessage })
 if (!buffer || buffer.length === 0) throw new Error('No se pudo descargar')

 let nombre = agregarGif(cmd, buffer, 'mp4')
 let total = listarGifs(cmd).length
 let tipo = videoMsg.gifPlayback ? 'GIF' : `Video (${segundos}s)`

 await sock.sendMessage(jid, { text: `❀ ${tipo} guardado\n\n📌 Comando: .${cmd}\n📁 Archivo: ${nombre}\n📦 Total en .${cmd}: ${total}\n📂 En: core/dbreacciones/${cmd}/` }, { quoted: m })
 } catch(e){
 console.log('[ADDGIF]', e.message)
 await sock.sendMessage(jid, { text: `❌ No pude descargar: ${e.message}`.slice(0, 500) }, { quoted: m })
 }
}
export default handler
