import axios from 'axios'
export const handler = {}
handler.name = 'traducir'
handler.alias = ['translate', 'tr']
handler.category = 'tools'
handler.exec = async (sock, m, a) => {
 const chatId = m.key.remoteJid
 let args = a.join(" ").trim()
 // .traducir en Hola / .traducir en|Hola / .traducir Hola
 let lang = 'es', texto = args
 if (args.includes('|')) { let p = args.split('|'); lang = p[0].trim().replace(/^[a-z]{2}\s+/i,'').trim() || 'es'; texto = p.slice(1).join('|').trim() }
 else if (/^[a-z]{2}\s+/i.test(args)) { let p = args.split(/\s+/); lang = p[0].toLowerCase(); texto = p.slice(1).join(' ') }
 else if (!args) {
 let quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation || m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text
 if (quoted) texto = quoted
 }
 if (!texto) return sock.sendMessage(chatId, { text: "✳️ .traducir en Hola como estas\nIdiomas: es, en, pt, fr, it, ja, ko" }, { quoted: m })
 try {
 let { data } = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(texto)}`)
 let traducido = data[0].map(x => x[0]).join('')
 let detectado = data[2] || 'auto'
 let txt = `────────────────────
· · ──────── ·· ──────── · ·
├┈ ✦ TRADUCIR ✦
├• ✐; ${detectado} ➜ ${lang}
╰─────── ✦・🌐・✦ ───────

📝 𝙊𝙧𝙞𝙜𝙞𝙣𝙖𝙡:
${texto}

🌐 𝙏𝙧𝙖𝙙𝙪𝙘𝙘𝙞𝙤𝙣:
${traducido}
╰─────── ✦・🚀・✦ ───────
────────────────────`
 await sock.sendMessage(chatId, { text: txt }, { quoted: m })
 } catch(e){ await sock.sendMessage(chatId, { text: `❌ ${e.message}` }, { quoted: m }) }
}
export default handler
