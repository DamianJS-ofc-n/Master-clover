export const handler = {}
handler.name = 'quien'
handler.category = 'fun'
handler.exec = async (sock, m, a) => {
 const chatId = m.key.remoteJid
 if (!chatId.endsWith('@g.us')) return sock.sendMessage(chatId, { text: "❌ Solo en grupos" }, { quoted: m })
 let pregunta = a.join(" ").trim()
 if (!pregunta) return sock.sendMessage(chatId, { text: "✳️ .quien es el más dormilón?" }, { quoted: m })
 try {
 const meta = await sock.groupMetadata(chatId)
 const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net'
 let members = meta.participants.filter(p => p.id !== botId).map(p => p.id)
 if (!members.length) return sock.sendMessage(chatId, { text: "❌ No hay miembros" }, { quoted: m })
 const elegido = members[Math.floor(Math.random() * members.length)]
 const txt = `────────────────────
· · ──────── ·· ──────── · ·
├┈ ✦ QUIEN ✦
├• ✐; ${pregunta}
╰─────── ✦・❓・✦ ───────

👤 𝙀𝙡𝙚𝙜𝙞𝙙𝙤:
├• ✐; @${elegido.split('@')[0]}

╰─────── ✦・🚀・✦ ───────
────────────────────`
 await sock.sendMessage(chatId, { text: txt, mentions: [elegido] }, { quoted: m })
 } catch(e){ await sock.sendMessage(chatId, { text: `❌ ${e.message}` }, { quoted: m }) }
}
export default handler
