import fs from 'fs'
import path from 'path'
const DB = './db/notas.json'
function load(){ try{ if(!fs.existsSync(DB)) return {}; return JSON.parse(fs.readFileSync(DB)) }catch{ return {} } }
function save(d){ fs.mkdirSync(path.dirname(DB), {recursive:true}); fs.writeFileSync(DB, JSON.stringify(d, null, 2)) }

export const handler = {}
handler.name = 'setnotas'
handler.alias = ['agregarnota', 'addnota']
handler.category = 'tools'
handler.exec = async (sock, m, a) => {
 const chatId = m.key.remoteJid
 const user = m.key.participant || m.key.remoteJid
 let input = a.join(" ").trim()
 if (!input.includes('|')) return sock.sendMessage(chatId, { text: "✳️ .setnotas titulo | contenido\nEj: .setnotas torneo | El sábado a las 20hs" }, { quoted: m })
 let [titulo, ...rest] = input.split('|')
 let contenido = rest.join('|').trim()
 titulo = titulo.trim()
 if (!titulo || !contenido) return sock.sendMessage(chatId, { text: "❌ Faltó titulo o contenido" }, { quoted: m })
 let db = load()
 if (!db[user]) db[user] = []
 db[user].push({ titulo, contenido, fecha: new Date().toLocaleDateString('es-ES') })
 save(db)
 await sock.sendMessage(chatId, { text: `✅ Nota guardada\n📌 *${titulo}*\n${contenido}` }, { quoted: m })
}
export default handler
