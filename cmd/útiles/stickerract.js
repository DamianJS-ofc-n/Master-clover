const USAR_STICKER_FIJO = false
const STICKER_FIJO = {
 url: '...', directPath: '...',
 fileSha256: Buffer.from([]), fileEncSha256: Buffer.from([]),
 mediaKey: Buffer.from([]), mimetype: 'image/webp',
 width: 64, height: 64, fileLength: 0, mediaKeyTimestamp: 0, isAnimated: false
}

export const handler = {}
handler.name = 'stickerreact'
handler.alias = ['reactsticker', 'rst']
handler.category = 'útiles'
handler.description = 'Reacciona a un mensaje usando un sticker citado'

handler.exec = async (sock, m, args) => {
 const jid = m.key.remoteJid
 const ctx =
 m.message?.extendedTextMessage?.contextInfo ||
 m.message?.imageMessage?.contextInfo ||
 m.message?.videoMessage?.contextInfo ||
 m.message?.documentMessage?.contextInfo ||
 m.message?.audioMessage?.contextInfo ||
 m.message?.stickerMessage?.contextInfo ||
 m.message?.buttonsResponseMessage?.contextInfo ||
 m.message?.listResponseMessage?.contextInfo ||
 m.message?.templateButtonReplyMessage?.contextInfo ||
 m.message?.interactiveResponseMessage?.contextInfo

 const quotedMsg = ctx?.quotedMessage
 const quotedStanzaId = ctx?.stanzaId
 const quotedParticipant = ctx?.participant

 if (!quotedMsg) {
 return sock.sendMessage(jid, { text: `《✧》 ¡Debes responder a un *sticker*!\n\n*USO:*\n> • .rst _(respondiendo a un sticker)_` }, { quoted: m })
 }

 const isSticker = quotedMsg?.stickerMessage || quotedMsg?.lottieStickerMessage?.message?.stickerMessage
 if (!isSticker) {
 return sock.sendMessage(jid, { text: `《✧》 ¡Debes responder a un *sticker*!` }, { quoted: m })
 }

 try {
 let downloadMediaMessage, prepareWAMessageMedia
 try {
 const baileys = await import('baileys')
 downloadMediaMessage = baileys.downloadMediaMessage
 prepareWAMessageMedia = baileys.prepareWAMessageMedia
 } catch {
 const ws = await import('WhiskeySockets-locosyasociados')
 downloadMediaMessage = ws.downloadMediaMessage
 prepareWAMessageMedia = ws.prepareWAMessageMedia
 }

 await sock.sendMessage(jid, { react: { text: '🕒', key: m.key } })

 const parentKey = {
 remoteJid: jid,
 fromMe: false,
 id: quotedStanzaId,
 participant: jid.endsWith('@g.us') ? quotedParticipant : undefined
 }

 let sticker
 if (USAR_STICKER_FIJO) {
 sticker = { ...STICKER_FIJO }
 } else {
 let s = isSticker
 if (!s?.mediaKey && !s?.directPath) {
 const msgToDownload = {
 key: { remoteJid: jid, id: quotedStanzaId, fromMe: false, participant: quotedParticipant },
 message: quotedMsg
 }
 const buffer = await downloadMediaMessage(msgToDownload, 'buffer', {}, { logger: console, reuploadRequest: sock.updateMediaMessage })
 if (!buffer) throw new Error('No se pudo descargar')
 const prep = await prepareWAMessageMedia({ sticker: buffer }, { upload: sock.waUploadToServer })
 s = prep.stickerMessage
 }
 sticker = {
 url: s.url, directPath: s.directPath,
 fileSha256: s.fileSha256, fileEncSha256: s.fileEncSha256,
 mediaKey: s.mediaKey, mimetype: s.mimetype || 'image/webp',
 width: s.width || 64, height: s.height || 64,
 fileLength: s.fileLength, mediaKeyTimestamp: s.mediaKeyTimestamp,
 isAnimated: !!s.isAnimated
 }
 }

 await sock.relayMessage(jid, {
 messageContextInfo: { messageAssociation: { associationType: 11, parentMessageKey: parentKey } },
 stickerMessage: {
 ...sticker,
 contextInfo: { forwardingScore: 1, isForwarded: true, forwardOrigin: 0 },
 stickerSentTs: 0,
 isAvatar: false,
 isAiSticker: false,
 isLottie: false,
 premium: 0
 }
 }, {})

 await sock.sendMessage(jid, { react: { text: '✔️', key: m.key } })
 } catch (e) {
 console.log('[stickerreact]', e)
 await sock.sendMessage(jid, { react: { text: '✖️', key: m.key } })
 await sock.sendMessage(jid, { text: `《✧》 Error: ${e.message}`.slice(0, 1000) }, { quoted: m })
 }
}
