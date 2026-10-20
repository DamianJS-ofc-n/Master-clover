import fs from 'fs/promises'
import config from '../../config.js'

const charactersFilePath = './core/characters.json'
async function loadCharacters() { return JSON.parse(await fs.readFile(charactersFilePath,'utf-8')) }
function flattenCharacters(s){ return Object.values(s).flatMap(v=>Array.isArray(v.characters)?v.characters:[]) }

export const handler = {}
handler.name = 'delchar'
handler.alias = ['deletewaifu','delwaifu']
handler.category = 'gacha'
handler.description = 'Eliminar un personaje reclamado'

handler.exec = async (sock,m,args,extra)=>{
 const chatId = m.key.remoteJid
 const sender = m.key.participant || m.key.remoteJid
 const usedPrefix = extra?.usedPrefix || '.'
 let db = global.db?.data || {}
 if (!db.chats) db.chats={}
 if (!db.chat_users) db.chat_users={}
 if (!db.chat_users[chatId]) db.chat_users[chatId]={}
 if (!db.characters) db.characters={}
 let user = db.chat_users[chatId][sender] || { characters: [], favorite: '' }
 if (!Array.isArray(user.characters) ||!user.characters.length) return sock.sendMessage(chatId,{text:`❀ No tienes personajes reclamados.`},{quoted:m})
 const inputArgs = args.args || args
 if (!inputArgs.length) return sock.sendMessage(chatId,{text:`❀ Debes especificar un personaje.\n> Ejemplo » *${usedPrefix}delchar Yuki Suou*`},{quoted:m})

 const inputName = inputArgs.join(' ').toLowerCase().trim()
 const structure = await loadCharacters()
 const all = flattenCharacters(structure)
 const character = all.find(c=>c.name.toLowerCase()===inputName)
 if (!character) return sock.sendMessage(chatId,{text:`ꕥ No se encontró *${inputName}*`},{quoted:m})
 if (!user.characters.includes(character.id)) return sock.sendMessage(chatId,{text:`ꕥ *${character.name}* no está reclamado por ti.`},{quoted:m})

 const charKey = chatId+'__'+character.id
 let characterData = db.characters[charKey]
 if (characterData && characterData.user===sender){ delete characterData.user; delete characterData.claimedAt; db.characters[charKey]=characterData }
 user.characters = user.characters.filter(id=>id!==character.id)
 db.chat_users[chatId][sender].characters = user.characters
 if (user.favorite===character.id){ db.chat_users[chatId][sender].favorite=''; if(db.users?.[sender]) db.users[sender].favorite='' }
 extra?.saveDB?.(); global.saveDB?.()
 await sock.sendMessage(chatId,{text:`❀ *${character.name}* ha sido eliminado de tu lista.`},{quoted:m})
}
