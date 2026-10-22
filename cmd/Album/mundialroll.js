import fetch from 'node-fetch'
const rollLocks = new Map()
function norm(id){ return id?.split('@')[0].replace(/\D/g,'').slice(-10) }
function getUserKey(chatId, userId){
 let db = global.db?.data || {}
 let users = db.chat_users?.[chatId] || {}
 if(users[userId]) return userId
 let target = norm(userId)
 for(let uid in users){ if(norm(uid)===target) return uid }
 return userId
}
const KEY = 'hk_live_emalahxKe_Y5yamxR2ysovb70Niz_BUBRFrcq0M4YQA'
const BASE = 'https://hikariapi.skyultraweb.com/api/scrapers/pinterest/search'
const JUGADORES = [
"Messi","Mbappe","Cristiano Ronaldo","Haaland","Lamine Yamal","Vinicius Jr","Bellingham","Pedri","Saka","Julian Alvarez",
"Neymar","Lautaro Martinez","Griezmann","Kane","Salah","Musiala","Valverde","Rodri","Gavi","Di Maria","Dybala","Mac Allister","Enzo Fernandez"
]
function getRareza(nombre){
 if(["Messi","Mbappe","Ronaldo","Haaland","Yamal"].some(n=>nombre.includes(n))) return {text:'leyenda', emoji:'🌟', stars:'★★★★★', valor:5000}
 if(["Vinicius","Bellingham","Pedri","Saka"].some(n=>nombre.includes(n))) return {text:'dorada', emoji:'💎', stars:'★★★★', valor:2000}
 return {text:'comun', emoji:'🍃', stars:'★★', valor:500}
}
export const handler = {}
handler.name = 'sobre'
handler.alias = ['sobres','mundial','mr','pack','abrir']
handler.category = 'album'
handler.exec = async (sock, m, args, extra) => {
 const chatId = m.key.remoteJid
 const userId = m.key.participant || m.key.remoteJid
 const usedPrefix = extra?.usedPrefix || '.'
 let db = global.db?.data || {}
 if (!db.chats) db.chats = {}
 if (!db.chats[chatId]) db.chats[chatId] = {}
 if (!db.chats[chatId].mundialRolls) db.chats[chatId].mundialRolls = {}
 if (!db.chat_users) db.chat_users = {}
 if (!db.chat_users[chatId]) db.chat_users[chatId] = {}
 const realKey = getUserKey(chatId, userId)
 if (!db.chat_users[chatId][realKey]) db.chat_users[chatId][realKey] = { lastMundialRoll: 0 }
 if (!db.mundialChars) db.mundialChars = {}
 if (rollLocks.has(userId) && Date.now() - rollLocks.get(userId) < 5000) return
 rollLocks.set(userId, Date.now())
 const user = db.chat_users[chatId][realKey]
 const now = Date.now()
 const cooldown = 2 * 60 * 1000
 if (user.lastMundialRoll && now < user.lastMundialRoll) {
 const r = Math.ceil((user.lastMundialRoll - now) / 1000)
 return sock.sendMessage(chatId, { text: `⏳ Espera *${r}s* para abrir otro sobre` }, { quoted: m })
 }
 try {
 await sock.sendMessage(chatId, { text: `📦 *Abriendo sobre...*` }, { quoted: m })
 const nombre = JUGADORES[Math.floor(Math.random()*JUGADORES.length)]
 const query = `figurita album mundial 2026 ${nombre} panini`
 const url = `${BASE}?q=${encodeURIComponent(query)}&limit=10&apikey=${KEY}`
 const json = await fetch(url).then(r=>r.json())
 let foto = null
 if(json.success && json.data?.length){
 foto = json.data[Math.floor(Math.random()*Math.min(3, json.data.length))].imageProxy || json.data[0].image
 }
 if(!foto) foto = `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=random&size=512`
 const rareza = getRareza(nombre)
 const charKey = chatId + '__mundial__' + nombre.replace(/\s/g,'_') + '__' + now
 const SHIELD = 15 * 1000
 const EXPIRE = 8 * 60 * 1000
 const data = { id: nombre.toLowerCase().replace(/\s/g,'_'), nombre, pais:"Mundial 2026", team:"Selección", pos:"Jugador", foto, numero:"?" }
 db.mundialChars[charKey] = { ...data, rareza: rareza.text, valor: rareza.valor, reservedBy: userId, reservedUntil: now + SHIELD, expiresAt: now + EXPIRE }
 const caption = `📦 *SOBRE MUNDIAL 2026*\n\n⚽ Te salio *${nombre}*!!\n*✦ Rareza* : ${rareza.text} ${rareza.emoji} ${rareza.stars}\n*💰 Valor* : ${rareza.valor}\n> 🛡️ Escudo 15s\n> ⏳ 8 min\n> Atrapalo con \`${usedPrefix}atraparm\``
 const sent = await sock.sendMessage(chatId, { image: { url: foto }, caption }, { quoted: m })
 db.chats[chatId].mundialRolls[sent.key.id] = { charKey, ...data, valor: rareza.valor, rareza: rareza.text, expiresAt: now + EXPIRE, reservedBy: userId, reservedUntil: now + SHIELD }
 user.lastMundialRoll = now + cooldown
 extra?.saveDB?.(); global.saveDB?.()
 setTimeout(async () => { try { const still = global.db?.data?.chats?.[chatId]?.mundialRolls?.[sent.key.id]; if(still) await sock.sendMessage(chatId, { text: `⚠️ *${nombre}* ya es libre!` }, { quoted: { key: sent.key } }) } catch {} }, SHIELD + 1000)
 setTimeout(async () => { try { if(global.db?.data?.chats?.[chatId]?.mundialRolls?.[sent.key.id]){ delete global.db.data.chats[chatId].mundialRolls[sent.key.id]; delete global.db.data.mundialChars[charKey]; await sock.sendMessage(chatId, { text: `💨 *${nombre}* huyo...` }, { quoted: { key: sent.key } }) } } catch {} }, EXPIRE)
 } catch (e) { await sock.sendMessage(chatId, { text: `❌ Error: ${e.message}` }, { quoted: m }) } finally { setTimeout(() => rollLocks.delete(userId), 3000) }
}
