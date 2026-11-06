import fs from 'fs'
import path from 'path'
const DB = './db/notas.json'
function load(){ try{ if(!fs.existsSync(DB)) return {}; return JSON.parse(fs.readFileSync(DB)) }catch{ return {} } }
function save(d){ fs.mkdirSync(path.dirname(DB), {recursive:true}); fs.writeFileSync(DB, JSON.stringify(d, null, 2)) }

export const handler = {}
handler.name = 'notas'
handler.alias = ['misnotas', 'mynotes']
handler.category = 'tools'
handler.exec = async (sock, m, a) => {
 const chatId = m.key.remoteJid
 const user = m.key.participant || m.key.remoteJid
 let db = load()
 let list = db[user] || []
 if (!list.length) return sock.sendMessage(chatId, { text: "📝 No tenés notas\nUsá: .setnotas titulo | contenido" }, { quoted: m })
 let txt = `────────────────────
· · ──────── ·· ──────── · ·
├┈ ✦ MIS NOTAS ✦
├• ✐; ${list.length} notas guardadas
╰─────── ✦・📝・✦ ───────\n\n` + list.map((n,i)=>`📌 *${i+1}. ${n.titulo}*\n${n.contenido}\n📅 ${n.fecha}`).join('\n\n') + `\n╰─────── ✦・🚀・✦ ───────\n────────────────────`
 await sock.sendMessage(chatId, { text: txt }, { quoted: m })
}
export default handler
