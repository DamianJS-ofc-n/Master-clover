export const handler = {}
handler.name = 'atrapar'
handler.alias = ['catch','robar']
handler.category = 'pokemon'
handler.exec = async (sock, m, args, extra) => {
 const chatId = m.key.remoteJid
 const userId = m.key.participant || m.key.remoteJid
 const ctx = m.message?.extendedTextMessage?.contextInfo
 const quotedId = ctx?.stanzaId
 if(!quotedId) return sock.sendMessage(chatId, { text: '❌ Responde a la imagen del pokemon con `.atrapar`' }, { quoted: m })

 let db = global.db?.data || {}
 const roll = db.chats?.[chatId]?.pokeRolls?.[quotedId]
 if(!roll) return sock.sendMessage(chatId, { text: '❌ Ya expiro, fue atrapado o no es un poke valido' }, { quoted: m })

 const now = Date.now()
 if(roll.expiresAt < now){ delete db.chats[chatId].pokeRolls[quotedId]; return sock.sendMessage(chatId, { text: '💨 Ya huyo, llegaste tarde' }, { quoted: m }) }

 if(roll.reservedUntil > now && roll.reservedBy!== userId){
  const left = Math.ceil((roll.reservedUntil - now)/1000)
  return sock.sendMessage(chatId, { text: `🛡️ Protegido por ${left}s para su invocador. Despues podras robarlo!` }, { quoted: m })
 }

 const char = db.pokeChars?.[roll.charKey]
 if(!char) return sock.sendMessage(chatId, { text: '❌ Data perdida' }, { quoted: m })

 if (!db.chat_users) db.chat_users = {}
 if (!db.chat_users[chatId]) db.chat_users[chatId] = {}
 if (!db.chat_users[chatId][userId]) db.chat_users[chatId][userId] = { pokes: [], coins: 0, lastPokeRoll: 0 }
 const user = db.chat_users[chatId][userId]

 let chance = 0.80
 if(char.isMyth) chance = 0.20
 else if(char.isLeg) chance = 0.30
 else if(char.rareza.includes('ultra')) chance = 0.45
 else if(char.rareza.includes('raro')) chance = 0.65

 const isRobo = roll.reservedBy!== userId && roll.reservedUntil < now
 if(Math.random() > chance){
  return sock.sendMessage(chatId, { text: `💥 *${char.name}* se solto! ${isRobo? 'Casi lo robas!' : 'Intenta otra vez!'}` }, { quoted: m })
 }

 user.pokes.push({ key: roll.charKey, id: char.id, name: char.name, value: char.value, caughtAt: now, rareza: char.rareza })
 delete db.chats[chatId].pokeRolls[quotedId]
 delete db.pokeChars[roll.charKey]
 extra?.saveDB?.(); global.saveDB?.()

 const msgRobo = isRobo? `🔥 *ROBO EXITOSO!* Le quitaste a @${roll.reservedBy.split('@')[0]} ` : `✅ Atrapaste a`
 await sock.sendMessage(chatId, { text: `${msgRobo} *${char.name}* #${char.id}!\n✦ Rareza: ${char.rareza}\n💰 Valor: ${char.value.toLocaleString()}`, mentions: isRobo? [roll.reservedBy] : [] }, { quoted: m })
}
