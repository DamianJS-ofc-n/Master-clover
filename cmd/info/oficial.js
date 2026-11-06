import config from '../../config.js'
export const handler = {}
handler.name = 'oficial'
handler.alias = ['oficiales', 'links', 'canales']
handler.category = 'info'
handler.exec = async (sock, m, a) => {
 const chatId = m.key.remoteJid
 const web = config.channels?.Web || config.channels?.web || 'Sin web'
 const canal = config.channels?.oficial || 'Sin canal'
 const txt = `· · ──────── ·· ──────── · ·
├┈ ✦ 𝙇𝙔𝘼 - 𝘿𝙊𝙈𝙄𝙉𝙄𝙊𝙎 𝙊𝙁𝙄𝘾𝙄𝘼𝙇𝙀𝙎 ✦
├• ✐; 𐚁ᴅᴀᴍɪᴀɴᴊs-ᴏғᴄ . 🌙
╰─────── ✦・👑・✦ ───────
├┈ ✦ 𝘿𝘼𝙏𝙊𝙎 ✦
├• ✐; ❀ Dev : 𐚁ᴅᴀᴍɪᴀɴᴊs-ᴏғᴄ
├• ✐; ❀ Web : ${web}
├• ✐; ❐ Club : LYA\`S CLUB
╰─────── ✦・🌐・✦ ───────
├┈ ✦ 𝙇𝙄𝙉𝙆𝙎 ✦
├• ✐; 仝 *Comunidad Oficial:* https://chat.whatsapp.com/BqwIcsxbi791o8AliPMeVd
├• ✐; 仝 *Grupo Oficial:* https://chat.whatsapp.com/LdmJDQVUCAcANYc4Eawofe?s=cl&p=a&iam=2
├• ✐; 仝 *Canal Oficial:* ${canal}
╰─────✦・🚀・✦─────`
 await sock.sendMessage(chatId, { text: txt }, { quoted: m })
}
export default handler
