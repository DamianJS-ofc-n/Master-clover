export const handler = {}
handler.name = 'pokebatalla'
handler.alias = ['pbattle','batallapoke','pvpoke']
handler.category = 'pokemon'
handler.description = 'Batalla pokemon por grupo'

handler.exec = async (sock,m,args,extra)=>{
 const chatId = m.key.remoteJid
 const sender = m.key.participant || m.key.remoteJid
 const ctx = m.message?.extendedTextMessage?.contextInfo || {}
 const target = m.mentionedJid?.[0] || ctx.mentionedJid?.[0] || ctx.participant || null
 if (!target) return sock.sendMessage(chatId,{text:`❀ Menciona a alguien para batallar\nEj:.pokebatalla @usuario`},{quoted:m})
 if (target===sender) return sock.sendMessage(chatId,{text:`No puedes pelear contigo mismo`},{quoted:m})

 let db = global.db?.data || {}
 let myPokes = db.chat_users?.[chatId]?.[sender]?.pokes || []
 let enemyPokes = db.chat_users?.[chatId]?.[target]?.pokes || []
 if (!myPokes.length) return sock.sendMessage(chatId,{text:`No tienes pokes en este grupo`},{quoted:m})
 if (!enemyPokes.length) return sock.sendMessage(chatId,{text:`@${target.split('@')[0]} no tiene pokes en este grupo`, mentions:[target]},{quoted:m})

 // elige el más fuerte de cada uno
 const getBest = (userId, list) => {
 let best = null
 for (const id of list){
 const keys = Object.keys(db.pokeChars||{}).filter(k=>k.startsWith(chatId+'__poke__') && db.pokeChars[k].id===id && db.pokeChars[k].user===userId)
 const poke = db.pokeChars[keys[keys.length-1]]
 if (poke && (!best || poke.value > best.value)) best = poke
 }
 return best
 }
 const myBest = getBest(sender, myPokes)
 const enemyBest = getBest(target, enemyPokes)
 if (!myBest ||!enemyBest) return sock.sendMessage(chatId,{text:`Error obteniendo pokes`},{quoted:m})

 const myPower = myBest.value + Math.floor(Math.random()*500)
 const enemyPower = enemyBest.value + Math.floor(Math.random()*500)
 const winner = myPower > enemyPower? sender : target
 const loser = winner===sender? target : sender
 const winPoke = winner===sender? myBest : enemyBest
 const losePoke = winner===sender? enemyBest : myBest

 let txt = `⚔️ *PokeBatalla Grupal* ⚔️\n\n`
 txt+=`👤 @${sender.split('@')[0]} con *${myBest.name}* (✰ ${myBest.value}) → Poder: *${myPower}*\n`
 txt+=`vs\n`
 txt+=`👤 @${target.split('@')[0]} con *${enemyBest.name}* (✰ ${enemyBest.value}) → Poder: *${enemyPower}*\n\n`
 txt+=`🏆 Ganador: @${winner.split('@')[0]} con *${winPoke.name}*\n💀 Perdedor: @${loser.split('@')[0]} con *${losePoke.name}*`

 await sock.sendMessage(chatId,{text:txt, mentions:[sender,target]},{quoted:m})
}
