import { loadDB, saveDB, senderCanon, learnLid, getUser } from '../../lib/poke.js'
export const handler = {}
handler.name = 'pokedaily'
handler.alias = ['daily', 'reclamar', 'pokereclamar']
handler.category = 'pokemon'
handler.exec = async (sock, m, args) => {
 learnLid(m)
 const jid = m.key.remoteJid
 const me = senderCanon(m)
 const db = loadDB()
 const user = getUser(db, me)
 let now = Date.now()
 let last = user.lastDaily || 0
 let falta = 24*60*60*1000 - (now - last)
 if(falta > 0){
 let h = Math.floor(falta/3600000), mi = Math.floor((falta%3600000)/60000)
 return sock.sendMessage(jid, {text:`⏳ Ya reclamaste hoy, volvé en ${h}h ${mi}m`}, {quoted:m})
 }
 let coins = 100 + Math.floor(Math.random()*150)
 let balls = Math.random() < 0.5 ? 'pokeball' : 'superball'
 user.pokeCoins += coins
 user.balls[balls] = (user.balls[balls]||0)+1
 user.lastDaily = now
 saveDB(db)
 await sock.sendMessage(jid, {text:`🎁 *DAILY RECLAMADO*\n💰 +${coins} PokeCoins\n🎒 +1 ${balls}\n💰 Total: ${user.pokeCoins} PokeCoins\nVolvé mañana por más`}, {quoted:m})
}
export default handler
