import { loadDB, saveDB, senderCanon, learnLid, getUser } from '../../lib/poke.js'
export const handler = {}
handler.name = 'pokeshop'
handler.alias = ['tienda', 'shop']
handler.category = 'pokemon'
const PRECIOS = { pokeball: 50, superball: 150, ultraball: 300, masterball: 1000 }
handler.exec = async (sock, m, args) => {
 learnLid(m)
 const jid = m.key.remoteJid
 const me = senderCanon(m)
 const db = loadDB()
 const user = getUser(db, me)
 if(!args[0]){
 return sock.sendMessage(jid, {text:`🛒 *POKESHOP*\n💰 Tus PokeCoins: ${user.pokeCoins}\n🎒 Pokeball: ${user.balls.pokeball} | Super: ${user.balls.superball} | Ultra: ${user.balls.ultraball} | Master: ${user.balls.masterball}\n\nPrecios:\n• pokeball - 50\n• superball - 150\n• ultraball - 300\n• masterball - 1000 (100% captura)\n\nUso: *.pokeshop pokeball* o *.pokeshop ultraball 2*\n\n💡 Ganas PokeCoins por cada pokemon que atrapas segun su valor y rareza.`}, {quoted:m})
 }
 let ball = args[0].toLowerCase()
 if(ball==='super') ball='superball'; if(ball==='ultra') ball='ultraball'; if(ball==='master') ball='masterball'
 if(!PRECIOS[ball]) return sock.sendMessage(jid, {text:'❌ Esa pokebola no existe'}, {quoted:m})
 let cant = parseInt(args[1]||'1') || 1
 let costo = PRECIOS[ball]*cant
 if(user.pokeCoins < costo) return sock.sendMessage(jid, {text:`❌ Te faltan PokeCoins, tenés ${user.pokeCoins} y necesitas ${costo}`}, {quoted:m})
 user.pokeCoins -= costo
 user.balls[ball] = (user.balls[ball]||0)+cant
 saveDB(db)
 await sock.sendMessage(jid, {text:`✅ Compraste ${cant}x ${ball} por ${costo} PokeCoins\n💰 Te quedan ${user.pokeCoins} PokeCoins\n🎒 Ahora tenés ${user.balls[ball]} ${ball}`}, {quoted:m})
}
export default handler
