import { loadDB, saveDB, senderCanon, mentionedCanon, learnLid, getUser } from '../../lib/poke.js'
export const handler = {}
handler.name = 'intercambiar'
handler.alias = ['trade', 'intercambio']
handler.category = 'pokemon'
// .intercambiar @user 1 2 -> yo doy mi poke 1, el da su poke 2
handler.exec = async (sock, m, args) => {
 learnLid(m)
 const jid = m.key.remoteJid
 const me = senderCanon(m)
 let rival = mentionedCanon(m)[0]
 if(!rival) return sock.sendMessage(jid, {text:'❌ Uso: *.intercambiar @user <tu poke> <su poke>*\nEj: *.intercambiar @juan 1 2*'}, {quoted:m})
 let miIdx = parseInt(args[0])-1
 let suIdx = parseInt(args[1])-1
 // args vienen con la mencion primero? si es asi, los numeros son args 1 y 2
 if(isNaN(miIdx)){ miIdx = parseInt(args[1])-1; suIdx = parseInt(args[2])-1 }
 const db = loadDB()
 const u1 = getUser(db, me)
 const u2 = getUser(db, rival)
 if(isNaN(miIdx) || !u1.pokes[miIdx]) return sock.sendMessage(jid, {text:'❌ Tu poke no existe, mirá *.pokedex*'}, {quoted:m})
 if(isNaN(suIdx) || !u2.pokes[suIdx]) return sock.sendMessage(jid, {text:'❌ El poke de tu rival no existe'}, {quoted:m})
 let p1 = u1.pokes[miIdx], p2 = u2.pokes[suIdx]
 // intercambio directo, sin confirmacion para que sea rapido en grupo
 u1.pokes[miIdx] = p2
 u2.pokes[suIdx] = p1
 saveDB(db)
 await sock.sendMessage(jid, {text:`🔄 *¡INTERCAMBIO HECHO!*\n\n👉 Vos diste *${p1.name}* y recibiste *${p2.name}*\n👉 Tu rival dio *${p2.name}* y recibió *${p1.name}*`}, {quoted:m})
}
export default handler
