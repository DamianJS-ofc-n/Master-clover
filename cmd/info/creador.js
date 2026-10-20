export const handler = {}
handler.name = 'creator'
handler.alias = ['creador', 'owner', 'creadorofc']
handler.category = 'general'

handler.exec = async (sock, m) => {
 const jid = m.key.remoteJid

 const texto = `︶݂⏝︶ ۪ 〪⎗࣭ ๋⭐ᩧ̥ ۪ ׁ 𑰻 〪 ࣭ ۫︶݂⏝
˚˖𓍢ִ໋🌿˚ 𓆩 C̷r̷e̷a̷t̷o̷r̷ 𓆪🎋᭄᭡—ֹ̩̥̩̥̩̥̩̩̥⊹✧˖°꒰🌸꒱
🎋 ︧ ︨֟፝ ᪰ ₎ᩚ᳣ ︧N̷a̷m̷e̷ > ⏤͟͞ू⃪ ፝͜⁞⌗𝘿𝗮𝗺𝗶𝗮𝗻.𝗷𝘀-𝗼𝗳𝗰 🦊
🎋 ︧ ︨֟፝ ᪰ ₎ᩚ᳣ ︧N̷u̷m̷e̷r̷o̷ > +54 9 264 574-6772
> 🍰 Puedes pedir ayuda al privado de mi creador ᪰₎ᩚ᳣
︶݂⏝︶ ۪ 〪⎗࣭ ๋⭐ᩧ̥ ۪ ׁ 𑰻 〪 ࣭ ۫︶݂⏝`

 await sock.sendMessage(jid, { text: texto }, { quoted: m })

 const vcard = `BEGIN:VCARD
VERSION:3.0
FN:𝘿𝗮𝗺𝗶𝗮𝗻.𝗷𝘀-𝗼𝗳𝗰
ORG:C̷r̷e̷a̷t̷o̷r̷;
TEL;type=CELL;type=VOICE;waid=5492645746772:+54 9 264 574-6772
END:VCARD`

 await sock.sendMessage(jid, {
 contacts: {
 displayName: 'C̷r̷e̷a̷t̷o̷r̷',
 contacts: [{ vcard }]
 }
 }, { quoted: m })
}
