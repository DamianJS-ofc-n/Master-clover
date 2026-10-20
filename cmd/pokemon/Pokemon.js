import axios from 'axios'
const rollLocks = new Map()
const typeEs = { normal:'normal', fire:'fuego', water:'agua', grass:'planta', electric:'electrico', ice:'hielo', fighting:'lucha', poison:'veneno', ground:'tierra', flying:'volador', psychic:'psiquico', bug:'bicho', rock:'roca', ghost:'fantasma', dragon:'dragon', dark:'siniestro', steel:'acero', fairy:'hada' }
const typeEmoji = { normal:'⚪', fire:'🔥', water:'💧', grass:'🌿', electric:'⚡', ice:'❄️', fighting:'🥊', poison:'☠️', ground:'🌍', flying:'🕊️', psychic:'🔮', bug:'🐛', rock:'🪨', ghost:'👻', dragon:'🐉', dark:'🌑', steel:'⚙️', fairy:'🧚' }
function norm(id){ return id?.split('@')[0].replace(/\D/g,'').slice(-10) }
function getUserKey(chatId, userId){
 let db = global.db?.data || {}
 let users = db.chat_users?.[chatId] || {}
 if(users[userId]) return userId
 let target = norm(userId)
 for(let uid in users){ if(norm(uid)===target) return uid }
 return userId
}
function getRareza(isLeg, isMyth, id, baseExp){
 if(isMyth) return { text: 'mitico', emoji: '💫', stars: '★★★★★' }
 if(isLeg) return { text: 'legendario', emoji: '🌟', stars: '★★★★★' }
 if(baseExp >= 250 || id > 900) return { text: 'ultra raro', emoji: '💎', stars: '★★★★' }
 if(baseExp >= 170) return { text: 'raro', emoji: '🔮', stars: '★★★' }
 if(baseExp >= 100) return { text: 'poco comun', emoji: '✨', stars: '★★' }
 return { text: 'comun', emoji: '🍃', stars: '★' }
}
export const handler = {}
handler.name = 'pokemon'
handler.alias = ['pokémon', 'pokegacha', 'pokeroll', 'pr', 'poke']
handler.category = 'pokemon'
handler.exec = async (sock, m, args, extra) => {
 const chatId = m.key.remoteJid
 const userId = m.key.participant || m.key.remoteJid
 const usedPrefix = extra?.usedPrefix || '.'
 let db = global.db?.data || {}
 if (!db.chats) db.chats = {}
 if (!db.chats[chatId]) db.chats[chatId] = {}
 if (!db.chats[chatId].pokeRolls) db.chats[chatId].pokeRolls = {}
 if (!db.chat_users) db.chat_users = {}
 if (!db.chat_users[chatId]) db.chat_users[chatId] = {}
 const realKey = getUserKey(chatId, userId)
 if (!db.chat_users[chatId][realKey]) db.chat_users[chatId][realKey] = { lastPokeRoll: 0, pokes: [] }
 if (!db.pokeChars) db.pokeChars = {}
 if (rollLocks.has(userId) && Date.now() - rollLocks.get(userId) < 5000) return
 rollLocks.set(userId, Date.now())
 const user = db.chat_users[chatId][realKey]
 const now = Date.now()
 const cooldown = 2 * 60 * 1000
 if (user.lastPokeRoll && now < user.lastPokeRoll) {
 const r = Math.ceil((user.lastPokeRoll - now) / 1000)
 return sock.sendMessage(chatId, { text: `⏳ Espera *${r}s* - cooldown 2min` }, { quoted: m })
 }
 try {
 const pokeId = Math.floor(Math.random() * 1025) + 1
 const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokeId}`, { timeout: 10000 })
 const data = res.data
 let species = { is_legendary: false, is_mythical: false }
 try { const res2 = await axios.get(`https://pokeapi.co/api/v2/pokemon-species/${pokeId}`, { timeout: 8000 }); species = res2.data } catch {}
 const name = data.name
 const weight = data.weight
 const height = data.height
 const typesRaw = data.types.map(t => t.type.name)
 const typesEs = typesRaw.map(t => typeEs[t] || t).join(' / ')
 const typesEmoji = typesRaw.map(t => typeEmoji[t] || '🔹').join(' ')
 const rareza = getRareza(species.is_legendary, species.is_mythical, data.id, data.base_experience || 0)
 let value = (data.base_experience || 60) + data.stats.reduce((a,b)=>a+b.base_stat,0)
 if(species.is_legendary) value += 2500
 if(species.is_mythical) value += 4000
 const sprite = data.sprites.other['official-artwork'].front_default || data.sprites.front_default
 const charKey = chatId + '__poke__' + data.id + '__' + now
 const SHIELD = 15 * 1000
 const EXPIRE = 8 * 60 * 1000
 db.pokeChars[charKey] = { id: data.id, name, weight, height, types: typesEs, value, isLeg: species.is_legendary, isMyth: species.is_mythical, rareza: rareza.text, reservedBy: realKey, reservedUntil: now + SHIELD, expiresAt: now + EXPIRE, sprite }
 const caption = `🌵 Te salio *${name}*!!\n*✰ ID* : ${data.id}\n*✿︎ Nombre* : ${name}\n*☘︎ Peso* : ${weight}\n*❁ Altura* : ${height}\n*߷ Tipo* : ${typesEs} ${typesEmoji}\n*✦ Rareza* : ${rareza.text} ${rareza.emoji} ${rareza.stars}\n*💰 Valor* : ${value.toLocaleString()}\n> 🛡️ Escudo 15s para ti\n> ⏳ Dura 8 min\n> *Atrapalo con \`${usedPrefix}atrapar\` respondiendo*`
 const sent = await sock.sendMessage(chatId, { image: { url: sprite }, caption }, { quoted: m })
 db.chats[chatId].pokeRolls[sent.key.id] = { id: data.id, charKey, name, value, expiresAt: now + EXPIRE, reservedBy: realKey, reservedUntil: now + SHIELD }
 user.lastPokeRoll = now + cooldown
 extra?.saveDB?.(); global.saveDB?.()
 setTimeout(async () => { try { const still = global.db?.data?.chats?.[chatId]?.pokeRolls?.[sent.key.id]; if(still) await sock.sendMessage(chatId, { text: `⚠️ El *${name}* ya es libre!` }, { quoted: { key: sent.key } }) } catch {} }, SHIELD + 1000)
 setTimeout(async () => { try { if(global.db?.data?.chats?.[chatId]?.pokeRolls?.[sent.key.id]){ delete global.db.data.chats[chatId].pokeRolls[sent.key.id]; delete global.db.data.pokeChars[charKey]; await sock.sendMessage(chatId, { text: `💨 *${name}* huyo despues de 8 min...` }, { quoted: { key: sent.key } }) } } catch {} }, EXPIRE)
 } catch (e) { await sock.sendMessage(chatId, { text: `❌ Error: ${e.message}` }, { quoted: m }) } finally { setTimeout(() => rollLocks.delete(userId), 3000) }
}