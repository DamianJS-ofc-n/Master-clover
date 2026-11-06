import fs from 'fs'
import path from 'path'
const DB = './db/notas.json'
function load(){ try{ if(!fs.existsSync(DB)) return {}; return JSON.parse(fs.readFileSync(DB)) }catch{ return {} } }
function save(d){ fs.mkdirSync(path.dirname(DB), {recursive:true}); fs.writeFileSync(DB, JSON.stringify(d, null, 2)) }

export const handler = {}
handler.name = 'delnotas'
handler.alias = ['borrarnota', 'deletenota']
handler.category = 'tools'
handler.exec = async (sock, m, a) => {
 const chatId = m.key.remoteJid
 const user = m.key.participant || m.key.remoteJid
 let input = a.join(" ").trim()
 if (!input) return sock.sendMessage(chatId, { text: "✳️ .delnotas 1\nO .delnotas titulo\nUsá .notas para ver el número" }, { quoted: m })
 let db = load()
 let list = db[user] || []
 if (!list.length) return sock.sendMessage(chatId, { text: "❌ No tenés notas" }, { quoted: m })
 let idx = -1
 if (!isNaN(input)) idx = parseInt(input) - 1
 else idx = list.findIndex(n => n.titulo.toLowerCase() === input.toLowerCase() || n.titulo.toLowerCase().includes(input.toLowerCase()))
 if (idx < 0 || idx >= list.length) return sock.sendMessage(chatId, { text: "❌ No encontré esa nota" }, { quoted: m })
 let borrada = list.splice(idx,1)[0]
 db[user] = list
 save(db)
 await sock.sendMessage(chatId, { text: `🗑️ Nota eliminada\n📌 *${borrada.titulo}*` }, { quoted: m })
}
export default handler
