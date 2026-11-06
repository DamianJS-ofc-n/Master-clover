import axios from 'axios'
export const handler = {}
handler.name = 'dolar'
handler.alias = ['dollar', 'euro', 'cotizacion']
handler.category = 'tools'
handler.exec = async (sock, m, a) => {
 const chatId = m.key.remoteJid
 try {
 let { data } = await axios.get('https://dolarapi.com/v1/dolares')
 let get = (casa) => data.find(d => d.casa === casa)
 let oficial = get('oficial'), blue = get('blue'), mep = get('bolsa'), ccl = get('contadoconliqui'), tarjeta = get('tarjeta'), cripto = get('cripto')
 let f = (d) => d ? `$${d.venta}` : 'N/A'
 let f2 = (d) => d ? `$${d.compra} / $${d.venta}` : 'N/A'
 let txt = `────────────────────
· · ──────── ·· ──────── · ·
├┈ ✦ DOLAR - ARGENTINA ✦
├• ✐; Cotización Actual
╰─────── ✦・💵・✦ ───────

💵 𝘿𝙤𝙡𝙖𝙧 𝙊𝙛𝙞𝙘𝙞𝙖𝙡:
├• ✐; ${f2(oficial)}

💙 𝘿𝙤𝙡𝙖𝙧 𝘽𝙡𝙪𝙚:
├• ✐; ${f2(blue)}

📈 𝘿𝙤𝙡𝙖𝙧 𝙈𝙀𝙋:
├• ✐; ${f2(mep)}

💳 𝘿𝙤𝙡𝙖𝙧 𝙏𝙖𝙧𝙟𝙚𝙩𝙖:
├• ✐; ${f(tarjeta)}

🪙 𝘿𝙤𝙡𝙖𝙧 𝘾𝙧𝙞𝙥𝙩𝙤:
├• ✐; ${f2(cripto)}
╰─────── ✦・🚀・✦ ───────
────────────────────`
 await sock.sendMessage(chatId, { text: txt }, { quoted: m })
 } catch(e){ await sock.sendMessage(chatId, { text: `❌ Error al traer cotización` }, { quoted: m }) }
}
export default handler
