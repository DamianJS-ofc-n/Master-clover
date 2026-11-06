import axios from 'axios'
export const handler = {}
handler.name = 'clima'
handler.alias = ['weather', 'tiempo']
handler.category = 'tools'
handler.exec = async (sock, m, a) => {
 const chatId = m.key.remoteJid
 let ciudad = a.join(" ").trim()
 if (!ciudad) return sock.sendMessage(chatId, { text: "✳️ .clima Villa Gesell" }, { quoted: m })
 try {
 let { data } = await axios.get(`https://wttr.in/${encodeURIComponent(ciudad)}?format=j1`)
 let c = data.current_condition[0]
 let area = data.nearest_area[0]
 let nombre = area.areaName[0].value + ", " + area.country[0].value
 let txt = `────────────────────
· · ──────── ·· ──────── · ·
├┈ ✦ CLIMA ✦
├• ✐; ${nombre}
╰─────── ✦・🌤️・✦ ───────

🌡️ 𝙏𝙚𝙢𝙥𝙚𝙧𝙖𝙩𝙪𝙧𝙖:
├• ✐; ${c.temp_C}°C | Sensación ${c.FeelsLikeC}°C

☁️ 𝘾𝙡𝙞𝙢𝙖:
├• ✐; ${c.weatherDesc[0].value}

💧 𝙃𝙪𝙢𝙚𝙙𝙖𝙙:
├• ✐; ${c.humidity}%

🌬️ 𝙑𝙞𝙚𝙣𝙩𝙤:
├• ✐; ${c.windspeedKmph} km/h

👁️ 𝙑𝙞𝙨𝙞𝙗𝙞𝙡𝙞𝙙𝙖𝙙:
├• ✐; ${c.visibility} km
╰─────── ✦・🚀・✦ ───────
────────────────────`
 await sock.sendMessage(chatId, { text: txt }, { quoted: m })
 } catch(e){ await sock.sendMessage(chatId, { text: `❌ No encontré "${ciudad}"` }, { quoted: m }) }
}
export default handler
