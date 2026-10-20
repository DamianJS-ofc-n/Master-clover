import fs from 'fs/promises'

const pending = {}
const charactersFilePath = './core/characters.json'
async function loadCharacters(){ return JSON.parse(await fs.readFile(charactersFilePath,'utf-8')) }
function flattenCharacters(s){ return Object.values(s).flatMap(v=>Array.isArray(v.characters)?v.characters:[]) }

export const handler = {}
handler.name = 'giveallharem'
handler.category = 'gacha'
handler.description = 'Regalar todos tus personajes'

handler.exec = async (sock,m,args,extra)=>{
 const chatId = m.key.remoteJid
 const sender = m.key.participant || m.key.remoteJid
 const ctx = m.message?.extendedTextMessage?.contextInfo || {}
 const target = m.mentionedJid?.[0] || ctx.mentionedJid?.[0] || ctx.participant || null
 if (!target) return sock.sendMessage(chatId,{text:'❀ Debes mencionar a quien regalarle tus personajes.'},{quoted:m})
 if (target===sender) return sock.sendMessage(chatId,{text:'ꕥ No puedes regalarte a ti mismo.'},{quoted:m})

 let db = global.db?.data || {}
 let user = db.chat_users?.[chatId]?.[sender] || { characters: [] }
 const ids = Array.isArray(user.characters)? user.characters : []
 const structure = await loadCharacters()
 const all = flattenCharacters(structure)
 const list=[]
 for (const id of ids){
 const chatKey = chatId+'__'+id
 const character = db.characters?.[chatKey]
 if (character && character.user===sender){
 const ref = all.find(c=>String(c.id)===String(id))
 list.push({ id, name: character.name || ref?.name || `ID:${id}`, value: character.value || ref?.value || 0 })
 }
 }
 if (!list.length) return sock.sendMessage(chatId,{text:'ꕥ No tienes personajes para regalar.'},{quoted:m})
 const total = list.reduce((s,c)=>s+c.value,0)
 const nameTarget = `@${target.split('@')[0]}`
 await sock.sendMessage(chatId,{text:`「✿」 *${m.pushName}*, ¿confirmas regalar todo tu harem a *${nameTarget}*?\n\n❏ Personajes: *${list.length}*\n❏ Valor total: *${total.toLocaleString()}*\n\n✐ Responde con *aceptar* (60s)`, mentions:[target]},{quoted:m})
 pending[sender]={ sender, to: target, ids: list.map(c=>c.id), value: total, count: list.length, chat: chatId, timeout: setTimeout(()=>delete pending[sender],60000) }
}

// hook para aceptar
export const before = async (sock,m,extra)=>{
 const sender = m.key.participant || m.key.remoteJid
 const data = pending[sender]
 if (!data) return false
 if ((m.text||'').trim().toLowerCase()!=='aceptar') return false
 if (m.key.remoteJid!==data.chat) return false
 let db = global.db?.data || {}
 let senderUser = db.chat_users?.[data.chat]?.[data.sender] || { characters: [] }
 let receiver = db.chat_users?.[data.chat]?.[data.to] || { characters: [] }
 if (!Array.isArray(receiver.characters)) receiver.characters=[]
 for (const id of data.ids){
 const giftKey = data.chat+'__'+id
 let character = db.characters?.[giftKey]
 if (!character || character.user!==data.sender) continue
 character.user=data.to; character.claimedAt=Date.now()
 db.characters[giftKey]=character
 if (!receiver.characters.includes(id)) receiver.characters.push(id)
 senderUser.characters = senderUser.characters.filter(c=>c!==id)
 }
 db.chat_users[data.chat][data.sender].characters = senderUser.characters
 db.chat_users[data.chat][data.to] = receiver
 clearTimeout(data.timeout); delete pending[sender]
 extra?.saveDB?.(); global.saveDB?.()
 await sock.sendMessage(data.chat,{text:`「✿」 Has regalado con éxito todo a @${data.to.split('@')[0]}!\n> ❏ Personajes: *${data.count}*\n> ⴵ Valor: *${data.value.toLocaleString()}*`, mentions:[data.to]},{quoted:m})
 return true
}
