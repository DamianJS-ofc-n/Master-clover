import { loadDB, saveDB, senderCanon, mentionedCanon, learnLid, getUser } from '../../lib/poke.js'
export const handler = {}
handler.name = 'regalar'
handler.alias = ['dar', 'gift']
handler.category = 'pokemon'
// .regalar @user 1 -> regala poke 1
// .regalar @user coins 100 -> regala coins
handler.exec = async (sock, m, args) => {
 learnLid(m)
 const jid = m.key.remoteJid
 const me = senderCanon(m)
 let rival = mentionedCanon(m)[0]
 if(!rival) return sock.sendMessage(jid, {text:'❌ Uso: *.regalar @user 1* o *.regalar @user coins 100*'}, {quoted:m})
 if(rival === me) return sock.sendMessage(jid, {text:'❌ No te podés regalar a vos mismo'}, {quoted:m})
 const db = loadDB()
 const u1 = getUser(db, me)
 const u2 = getUser(db, rival)
 // coins?
 let tipo = (args[0]||'').toLowerCase()
 // si args[0] es coins, args vienen como [coins, 100] o [mencion, coins, 100]
 let idxArg = args.find(a => /^\d+$/.test(a))
 let isCoins = args.some(a => a.toLowerCase() === 'coins' || a.toLowerCase() === 'coin')
 if(isCoins){
 let cant = parseInt(idxArg||'0')
 if(cant <= 0) return sock.sendMessage(jid, {text:'❌ Poné cantidad: *.regalar @user coins 100*'}, {quoted:m})
 if(u1.pokeCoins < cant) return sock.sendMessage(jid, {text:`❌ Tenés ${u1.pokeCoins} y querés regalar ${cant}`}, {quoted:m})
 u1.pokeCoins -= cant; u2.pokeCoins += cant; saveDB(db)
 return sock.sendMessage(jid, {text:`🎁 ¡Regalaste *${cant} PokeCoins*!\n💰 Te quedan ${u1.pokeCoins}`}, {quoted:m})
 }
 let idx = parseInt(idxArg||'0')-1
 if(isNaN(idx) || !u1.pokes[idx]) return sock.sendMessage(jid, {text:'❌ Ese poke no existe, mirá *.pokedex*'}, {quoted:m})
 let p = u1.pokes.splice(idx,1)[0]
 u2.pokes.push(p); saveDB(db)
 await sock.sendMessage(jid, {text:`🎁 ¡Regalaste a *${p.name}* (${p.rare})!\nAhora es de tu rival, que buen corazón ฅ⁠^⁠•⁠ﻌ⁠•⁠^⁠ฅ`}, {quoted:m})
}
export default handler
