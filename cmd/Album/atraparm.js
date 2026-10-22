export const handler = {}
handler.name = 'atraparm'
handler.alias = ['am','coger','catchm']
handler.category = 'album'
handler.description = 'Reclama figurita mundial'

handler.exec = async (sock, m, args, extra) => {
 const chatId = m.key.remoteJid
 const userId = m.key.participant || m.key.remoteJid
 const ctx = m.message?.extendedTextMessage?.contextInfo
 const quotedId = ctx?.stanzaId

 if(!quotedId) return sock.sendMessage(chatId, { text: '❌ Responde a la imagen del *mr* con `.atraparm` para reclamar' }, { quoted: m })

 let db = global.db?.data || {}
 const roll = db.chats?.[chatId]?.mundialRolls?.[quotedId]
 if(!roll) return sock.sendMessage(chatId, { text: '❌ Este roll ya expiro, fue reclamado o no es valido' }, { quoted: m })

 const now = Date.now()
 if(roll.expiresAt < now){
 delete db.chats[chatId].mundialRolls[quotedId]
 if(db.mundialChars?.[roll.charKey]) delete db.mundialChars[roll.charKey]
 extra?.saveDB?.(); global.saveDB?.()
 return sock.sendMessage(chatId, { text: '💨 Ya se fue, llegaste tarde' }, { quoted: m })
 }

 // escudo 15s para el que rolleo
 if(roll.reservedUntil > now && roll.reservedBy !== userId){
 const left = Math.ceil((roll.reservedUntil - now)/1000)
 return sock.sendMessage(chatId, { text: `🛡️ Protegido ${left}s para <@${roll.reservedBy.split('@')[0]}>, despues libre!`, mentions:[roll.reservedBy] }, { quoted: m })
 }

 if(!db.chat_users) db.chat_users={}
 if(!db.chat_users[chatId]) db.chat_users[chatId]={}
 if(!db.chat_users[chatId][userId]) db.chat_users[chatId][userId]={ mundial:[] }
 const user = db.chat_users[chatId][userId]
 if(!user.mundial) user.mundial=[]

 // evitar duplicados por id
 if(user.mundial.some(x=>x.id===roll.id && x.charKey===roll.charKey)){
 return sock.sendMessage(chatId, { text: '⚠️ Ya tienes esta figurita' }, { quoted: m })
 }

 const isRobo = roll.reservedBy !== userId

 user.mundial.push({ 
 id: roll.id, 
 charKey: roll.charKey, 
 nombre: roll.nombre, 
 pais: roll.pais,
 team: roll.team,
 foto: roll.foto,
 rareza: roll.rareza,
 valor: roll.valor,
 claimedAt: now 
 })

 delete db.chats[chatId].mundialRolls[quotedId]
 if(db.mundialChars?.[roll.charKey]){
 delete db.mundialChars[roll.charKey].reservedBy
 delete db.mundialChars[roll.charKey].reservedUntil
 }

 extra?.saveDB?.(); global.saveDB?.()

 const txt = isRobo
 ? `😹 *ROBO!* Le quitaste *${roll.nombre}* a @${roll.reservedBy.split('@')[0]}`
 : `✅ Reclamaste a *${roll.nombre}* [${roll.rareza}]`

 await sock.sendMessage(chatId, { text: txt, mentions: isRobo? [roll.reservedBy] : [] }, { quoted: m })
}
