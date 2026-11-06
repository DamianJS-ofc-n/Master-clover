import { loadDB, saveDB, senderCanon, learnLid, getUser } from '../../lib/poke.js'
export const handler = {}
handler.name = 'venderpoke'
handler.alias = ['vender', 'liberar']
handler.category = 'pokemon'
handler.exec = async (sock, m, args) => {
 learnLid(m)
 const jid = m.key.remoteJid
 const me = senderCanon(m)
 const db = loadDB()
 const user = getUser(db, me)
 let idx = parseInt(args[0])-1
 if(isNaN(idx) || !user.pokes[idx]) return sock.sendMessage(jid, {text:'❌ Uso: *.venderpoke 1* (mirá tu numero en *.pokedex*)'}, {quoted:m})
 let p = user.pokes.splice(idx,1)[0]
 let ganancia = Math.floor(p.valor * 0.7)
 user.pokeCoins += ganancia
 saveDB(db)
 await sock.sendMessage(jid, {text:`💰 Vendiste a *${p.name}* por ${ganancia} PokeCoins\n💰 Total: ${user.pokeCoins}`}, {quoted:m})
}
export default handler
