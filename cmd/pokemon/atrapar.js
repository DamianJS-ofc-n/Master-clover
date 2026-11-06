export const handler = {}
handler.name = 'atrapar'
handler.alias = ['catch','robar']
handler.category = 'pokemon'

const locks = new Set()

// LID FIX: WhatsApp puede mandar participant como @lid y participantAlt como @s.whatsapp.net
// Hay que usar los 2, no solo uno
function getSenderIds(m){
 const p = m.key?.participant || ''
 const alt = m.key?.participantAlt || ''
 const remote = m.key?.remoteJid || ''
 // El principal es el que viene en participant (puede ser lid)
 // El alt es el número real si viene
 const ids = [p, alt, remote].filter(Boolean)
 return [...new Set(ids)]
}
function getUserKey(m){
 // Usamos participantAlt (número real) si existe, si no participant (lid)
 // Así no se te duplican los usuarios
 return m.key?.participantAlt || m.key?.participant || m.key?.remoteJid
}
function sameUser(a, b){
 if(!a || !b) return false
 if(a === b) return true
 // Compara sin dominio: 51999 vs 51999, y lid vs lid
 const na = String(a).split('@')[0].split(':')[0]
 const nb = String(b).split('@')[0].split(':')[0]
 return na === nb
}
function sameUserAny(m, target){
 if(!target) return false
 const ids = getSenderIds(m)
 return ids.some(id => sameUser(id, target))
}
function mentionJid(id){
 // No inventar @s.whatsapp.net, usar el JID tal cual está guardado
 // Si es solo número sin @, ahí sí agregarle
 if(!id) return ''
 if(String(id).includes('@')) return String(id)
 return String(id) + '@s.whatsapp.net'
}
function displayTag(id){
 return String(id || '').split('@')[0].split(':')[0]
}

handler.exec = async (sock, m, args, extra) => {
 const chatId = m.key.remoteJid
 const userId = getUserKey(m) // clave estable
 const ctx = m.message?.extendedTextMessage?.contextInfo
 const quotedId = ctx?.stanzaId
 if(!quotedId) return sock.sendMessage(chatId, { text: '❀ Responde a la imagen del pokemon con `.atrapar`' }, { quoted: m })

 const lockKey = `${chatId}:${quotedId}`
 if(locks.has(lockKey)) return
 locks.add(lockKey)
 try{
 let db = global.db?.data || {}
 if(!db.chats) db.chats = {}
 if(!db.chats[chatId]) db.chats[chatId] = {}
 if(!db.chats[chatId].pokeRolls) db.chats[chatId].pokeRolls = {}

 const roll = db.chats[chatId].pokeRolls[quotedId]
 if(!roll) return sock.sendMessage(chatId, { text: '✘ Ya expiró, fue atrapado o no es un poke válido' }, { quoted: m })

 const now = Date.now()
 const expiresAt = roll.expiresAt || 0
 const reservedUntil = roll.reservedUntil || 0
 const reservedBy = roll.reservedBy || ''

 if(expiresAt && expiresAt < now){
 delete db.chats[chatId].pokeRolls[quotedId]
 try{ await extra?.saveDB?.() }catch{}
 return sock.sendMessage(chatId, { text: '❀ Ya huyó, llegaste tarde' }, { quoted: m })
 }

 // FIX LID: compara con participant Y participantAlt, no solo con uno
 const soyDueño = sameUserAny(m, reservedBy)
 if(reservedUntil > now && reservedBy && !soyDueño){
 const left = Math.ceil((reservedUntil - now)/1000)
 return sock.sendMessage(chatId, { text: `✿ Protegido por ${left}s para su invocador. Después podrás robarlo!` }, { quoted: m })
 }

 const char = db.pokeChars?.[roll.charKey]
 if(!char){
 delete db.chats[chatId].pokeRolls[quotedId]
 try{ await extra?.saveDB?.() }catch{}
 return sock.sendMessage(chatId, { text: '❌ Data perdida' }, { quoted: m })
 }

 if (!db.chat_users) db.chat_users = {}
 if (!db.chat_users[chatId]) db.chat_users[chatId] = {}

 // FIX LID: si el usuario ya existía guardado con el otro formato (lid vs número),
 // buscá su cuenta vieja para no duplicarlo
 let userKey = userId
 if(!db.chat_users[chatId][userKey]){
 const myIds = getSenderIds(m)
 for(let k of Object.keys(db.chat_users[chatId])){
 if(myIds.some(id => sameUser(id, k))){ userKey = k; break }
 }
 }
 if (!db.chat_users[chatId][userKey]) db.chat_users[chatId][userKey] = { pokes: [], coins: 0, lastPokeRoll: 0 }
 const user = db.chat_users[chatId][userKey]
 if(!Array.isArray(user.pokes)) user.pokes = []
 if(typeof user.coins !== 'number') user.coins = 0

 if(user._lastCatch && now - user._lastCatch < 2000){
 return sock.sendMessage(chatId, { text: '❀ Esperá 2s entre intentos' }, { quoted: m })
 }
 user._lastCatch = now

 const rareza = String(char.rareza || '').toLowerCase()
 let chance = 0.80
 if(char.isMyth) chance = 0.20
 else if(char.isLeg) chance = 0.30
 else if(rareza.includes('ultra')) chance = 0.45
 else if(rareza.includes('raro')) chance = 0.65

 const isRobo = reservedBy && !soyDueño && reservedUntil && reservedUntil < now

 if(Math.random() > chance){
 try{ await extra?.saveDB?.() }catch{}
 return sock.sendMessage(chatId, { text: `❀ *${char.name}* se soltó! ${isRobo ? 'Casi lo robas!' : 'Intenta otra vez!'}` }, { quoted: m })
 }

 if(user.pokes.some(p=>p && p.key === roll.charKey)){
 delete db.chats[chatId].pokeRolls[quotedId]
 try{ await extra?.saveDB?.() }catch{}
 return sock.sendMessage(chatId, { text: '⚠️ Ya lo tenías atrapado' }, { quoted: m })
 }

 user.pokes.push({ key: roll.charKey, id: char.id, name: char.name, value: char.value || 0, caughtAt: now, rareza: char.rareza || 'común' })
 delete db.chats[chatId].pokeRolls[quotedId]
 if(db.pokeChars) delete db.pokeChars[roll.charKey]
 try{ await extra?.saveDB?.() }catch{}
 try{ await global.saveDB?.() }catch{}

 const msgRobo = isRobo ? `❀ *ROBO EXITOSO!* Le quitaste a @${displayTag(reservedBy)} ` : `✿ Atrapaste a`
 const mentions = (isRobo && reservedBy) ? [mentionJid(reservedBy)] : []
 await sock.sendMessage(chatId, { text: `${msgRobo} *${char.name}* #${char.id}!\n✦ Rareza: ${char.rareza || 'común'}\n✠ Valor: ${(char.value || 0).toLocaleString()}`, mentions }, { quoted: m })
 }catch(e){
 console.log('[ATRAPAR ERROR]', e)
 await sock.sendMessage(chatId, { text: `❌ Error al atrapar: ${e.message || e}` }, { quoted: m })
 }finally{
 locks.delete(lockKey)
 }
}
export default handler
