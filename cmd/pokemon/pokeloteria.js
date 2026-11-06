import { loadDB, saveDB, senderCanon, learnLid, getUser } from '../../lib/poke.js'
export const handler = {}
handler.name = 'pokeloteria'
handler.alias = ['loteria', 'pokegacha', 'gacha']
handler.category = 'pokemon'
// .pokeloteria 100 -> apuesta 100 coins, 40% de duplicar, 10% de x5
handler.exec = async (sock, m, args) => {
 learnLid(m)
 const jid = m.key.remoteJid
 const me = senderCanon(m)
 const db = loadDB()
 const user = getUser(db, me)
 let apuesta = parseInt(args[0]||'0')
 if(!apuesta || apuesta < 10) return sock.sendMessage(jid, {text:'❌ Uso: *.pokeloteria 100* (mínimo 10)'}, {quoted:m})
 if(user.pokeCoins < apuesta) return sock.sendMessage(jid, {text:`❌ Tenés ${user.pokeCoins} PokeCoins`}, {quoted:m})
 let r = Math.random()
 let gano = 0, msg = ''
 if(r < 0.10){ gano = apuesta*5; msg = `🎰 *¡JACKPOT x5!*` }
 else if(r < 0.40){ gano = apuesta*2; msg = `🎉 ¡Ganaste x2!` }
 else if(r < 0.55){ gano = apuesta; msg = `😐 Recuperaste tu apuesta` }
 else { gano = 0; msg = `💀 Perdiste...` }
 user.pokeCoins = user.pokeCoins - apuesta + gano
 saveDB(db)
 await sock.sendMessage(jid, {text:`${msg}\n🎲 Apostaste ${apuesta}\n💰 Ganaste ${gano}\n💰 Total: ${user.pokeCoins} PokeCoins`}, {quoted:m})
}
export default handler
