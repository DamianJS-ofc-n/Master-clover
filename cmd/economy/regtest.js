export const handler = {}
handler.name = 'regtest'
handler.category = 'Economy'
handler.exec = async (sock, m) => {
 await sock.sendMessage(m.key.remoteJid, { text: '✅ El loader SI funciona' }, { quoted: m })
}
