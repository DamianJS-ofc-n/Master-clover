export const handler = {}
handler.name = 'claim'
handler.alias = ['c','reclamar']
handler.category = 'gacha'
handler.description = 'Reclama waifu del roll'

handler.exec = async (sock, m, args, extra) => {
 const chatId = m.key.remoteJid
 const userId = m.key.participant || m.key.remoteJid
 const ctx = m.message?.extendedTextMessage?.contextInfo
 const quotedId = ctx?.stanzaId

 if(!quotedId) return sock.sendMessage(chatId, { text: '❌ Responde a la imagen del *rw* con `.c` para reclamar' }, { quoted: m })

 let db = global.db?.data || {}
 const roll = db.chats?.[chatId]?.rolls?.[quotedId]
 if(!roll) return sock.sendMessage(chatId, { text: '❌ Este roll ya expiro, fue reclamado o no es valido' }, { quoted: m })

 const now = Date.now()
 if(roll.expiresAt < now){
  delete db.chats[chatId].rolls[quotedId]
  if(db.characters?.[roll.charKey]) delete db.characters[roll.charKey]
  extra?.saveDB?.(); global.saveDB?.()
  return sock.sendMessage(chatId, { text: '💨 Ya se fue, llegaste tarde' }, { quoted: m })
 }

 // escudo 20s para el invocador
 if(roll.reservedUntil > now && roll.reservedBy!== userId){
  const left = Math.ceil((roll.reservedUntil - now)/1000)
  return sock.sendMessage(chatId, { text: `🛡️ Protegido ${left}s para <@${roll.reservedBy.split('@')[0]}>, despues libre!`, mentions:[roll.reservedBy] }, { quoted: m })
 }

 if(!db.chat_users) db.chat_users={}
 if(!db.chat_users[chatId]) db.chat_users[chatId]={}
 if(!db.chat_users[chatId][userId]) db.chat_users[chatId][userId]={ characters:[], harem:[] }
 const user = db.chat_users[chatId][userId]
 if(!user.characters) user.characters=[]
 if(!user.harem) user.harem=[]

 const charData = db.characters?.[roll.charKey]
 if(!charData) return sock.sendMessage(chatId, { text: '❌ Data perdida' }, { quoted: m })

 const isRobo = roll.reservedBy!== userId

 // evitar duplicados
 if(user.harem.some(x=>x.id===roll.id && x.charKey===roll.charKey)){
  return sock.sendMessage(chatId, { text: '⚠️ Ya tienes este personaje' }, { quoted: m })
 }

 user.harem.push({ id: roll.id, charKey: roll.charKey, name: roll.name, claimedAt: now })
 // tambien en characters simple
 user.characters.push(roll.charKey)

 delete db.chats[chatId].rolls[quotedId]
 // no borres db.characters para que quede valor, solo libera reserva
 if(db.characters[roll.charKey]){
  delete db.characters[roll.charKey].reservedBy
  delete db.characters[roll.charKey].reservedUntil
 }

 extra?.saveDB?.(); global.saveDB?.()

 const txt = isRobo
 ? `😹 *ROBO!* Le quitaste *${roll.name}* a @${roll.reservedBy.split('@')[0]}`
  : `✅ Reclamaste a *${roll.name}*`

 await sock.sendMessage(chatId, { text: txt, mentions: isRobo? [roll.reservedBy] : [] }, { quoted: m })
}