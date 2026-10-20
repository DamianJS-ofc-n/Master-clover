import fs from 'fs'
const DB_PATH = './lib/akinator_db.json'
function loadDB(){ try{return JSON.parse(fs.readFileSync(DB_PATH,'utf8'))}catch{return []} }
function saveDB(db){ fs.writeFileSync(DB_PATH, JSON.stringify(db,null,2)) }

export const handler = {}
handler.name = 'aprender'
handler.category = 'Juegos'
handler.exec = async (sock, m, args) => {
 let jid = m.key.remoteJid
 let text = args.join(' ')
 // formato: Nombre | desc | tag1,tag2,tag3
 if (!text.includes('|')) return sock.sendMessage(jid, { text: `Uso: *.aprender Messi | Futbolista argentino | real,hombre,vivo,famoso,deporte,latino,argentina*` }, { quoted: m })
 let [name, desc, tagsRaw] = text.split('|').map(s=>s.trim())
 if (!name ||!tagsRaw) return
 let tags = tagsRaw.toLowerCase().split(',').map(s=>s.trim())
 let db = loadDB()
 db.push({ name, desc: desc||'Aprendido', tags })
 saveDB(db)
 await sock.sendMessage(jid, { text: `✅ Personaje *${name}* aprendido con tags: ${tags.join(', ')}` }, { quoted: m })
}
