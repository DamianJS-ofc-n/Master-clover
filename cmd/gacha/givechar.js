import fs from 'fs/promises'

const charactersFilePath = './core/characters.json'
async function loadCharacters(){ return JSON.parse(await fs.readFile(charactersFilePath,'utf-8')) }
function flattenCharacters(s){ return Object.values(s).flatMap(v=>Array.isArray(v.characters)?v.characters:[]) }

export const handler = {}
handler.name = 'givechar'
handler.alias = ['givewaifu','regalar']
handler.category = 'gacha'
handler.description = 'Regalar un personaje'

handler.exec = async (sock,m,args,extra)=>{
 const chatId = m.key.remoteJid
 const sender = m.key.participant || m.key.remoteJid
 const ctx = m.message?.extendedTextMessage?.contextInfo || {}
 const targetId = m.mentionedJid?.[0] || ctx.mentionedJid?.[0] || ctx.participant || null
 if (!targetId) return sock.sendMessage(chatId,{text:`❀ Debes mencionar o citar al destinatario.`},{quoted:m})
 if (!args.length) return sock.sendMessage(chatId,{text:`❀ Escribe el nombre del personaje y menciona.`},{quoted:m})

 let db = global.db?.data || {}
 if (!db.chat_users?.[chatId]?.[sender]) return sock.sendMessage(chatId,{text:'No estás registrado.'},{quoted:m})
 let senderUser = db.chat_users[chatId][sender]
 let target = db.chat_users[chatId][targetId]
 if (!target) return sock.sendMessage(chatId,{text:`El usuario no está registrado.`},{quoted:m})

 const characterName = args.join(' ').toLowerCase().trim()
 const structure = await loadCharacters()
 const all = flattenCharacters(structure)
 const character = all.find(c=>c.name.toLowerCase()===characterName)
 if (!character) return sock.sendMessage(chatId,{text:`ꕥ No se encontró *${characterName}*.`},{quoted:m})
 if (!senderUser.characters?.includes(character.id)) return sock.sendMessage(chatId,{text:`ꕥ *${character.name}* no es tuyo.`},{quoted:m})

 const charKey = chatId+'__'+character.id
 if (!db.characters) db.characters={}
 if (!db.characters[charKey]) db.characters[charKey]={ name: character.name, value: Number(character.value||0) }
 db.characters[charKey].user=targetId
 db.characters[charKey].claimedAt=Date.now()

 senderUser.characters = senderUser.characters.filter(id=>id!==character.id)
 if (!target.characters.includes(character.id)) target.characters.push(character.id)
 if (senderUser.favorite===character.id){ senderUser.favorite=''; if(db.users?.[sender]) db.users[sender].favorite='' }

 extra?.saveDB?.(); global.saveDB?.()
 await sock.sendMessage(chatId,{text:`❀ *${character.name}* regalado a @${targetId.split('@')[0]} por *${m.pushName}*`, mentions:[targetId]},{quoted:m})
}
