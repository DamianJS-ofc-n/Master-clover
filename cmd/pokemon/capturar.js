import { loadDB, saveDB, senderCanon, learnLid, getUser, catchChance } from '../../lib/poke.js'
export const handler = {}
handler.name = 'capturar'
handler.alias = ['atrapar', 'catch']
handler.category = 'pokemon'
handler.exec = async (sock, m, args) => {
 learnLid(m)
 const jid = m.key.remoteJid
 const me = senderCanon(m)
 const db = loadDB()
 const spawn = db.spawns[jid]
 if(!spawn) return sock.sendMessage(jid, {text:'❌ No hay pokemon salvaje, usá *.pokemon*'}, {quoted:m})
 const user = getUser(db, me)
 let ball = (args[0]||'pokeball').toLowerCase()
 if(ball==='super') ball='superball'
 if(ball==='ultra') ball='ultraball'
 if(ball==='master') ball='masterball'
 if(!user.balls[ball]) return sock.sendMessage(jid, {text:'❌ No tenés esa pokebola, comprá en *.pokeshop*'}, {quoted:m})
 if((user.balls[ball]||0) <= 0) return sock.sendMessage(jid, {text:`❌ No tenés ${ball}, comprá en *.pokeshop*`}, {quoted:m})
 user.balls[ball]--
 let chance = catchChance(spawn.poke, ball)
 let ok = Math.random() < chance
 if(!ok){
 saveDB(db)
 return sock.sendMessage(jid, {text:`💥 Se escapó *${spawn.poke.name}*... (${Math.round(chance*100)}% con ${ball})\nTe quedan ${user.balls[ball]} ${ball}`}, {quoted:m})
 }
 let pokeConUid = {...spawn.poke, uid: Date.now()+''+Math.floor(Math.random()*9999), owner: me, caughtAt: Date.now()}
 user.pokes.push(pokeConUid)
 user.pokeCoins += spawn.poke.valor
 delete db.spawns[jid]
 saveDB(db)
 await sock.sendMessage(jid, {text:`🎉 ¡Atrapaste a *${spawn.poke.name}*! (${spawn.poke.rare})\n💰 +${spawn.poke.valor} PokeCoins | Total: ${user.pokeCoins}\n📦 Tenés ${user.pokes.length} pokes`}, {quoted:m})
}
export default handler
