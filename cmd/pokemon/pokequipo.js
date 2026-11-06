import { loadDB, saveDB, senderCanon, learnLid, getUser } from '../../lib/poke.js'
export const handler = {}
handler.name = 'pokequipo'
handler.alias = ['equipo', 'team']
handler.category = 'pokemon'
// .pokequipo 1 2 3 -> arma equipo de 3, .pokequipo ver
handler.exec = async (sock, m, args) => {
 learnLid(m)
 const jid = m.key.remoteJid
 const me = senderCanon(m)
 const db = loadDB()
 const user = getUser(db, me)
 if(!args[0] || args[0]==='ver'){
 if(!user.equipo?.length) return sock.sendMessage(jid, {text:'❌ No tenés equipo, armalo: *.pokequipo 1 2 3*'}, {quoted:m})
 let txt = user.equipo.map((idx,i)=>{
 let p = user.pokes[idx]; return p ? `${i+1}. *${p.name}* | HP ${p.hp} | ATK ${p.atk}` : `${i+1}. vacío`
 }).join('\n')
 return sock.sendMessage(jid, {text:`👥 *TU EQUIPO*\n\n${txt}`}, {quoted:m})
 }
 let idxs = args.map(a=>parseInt(a)-1).filter(n=>!isNaN(n) && user.pokes[n])
 if(!idxs.length) return sock.sendMessage(jid, {text:'❌ Poné numeros de *.pokedex*: *.pokequipo 1 2 3*'}, {quoted:m})
 user.equipo = idxs.slice(0,3)
 saveDB(db)
 let nombres = user.equipo.map(i=>user.pokes[i].name).join(', ')
 await sock.sendMessage(jid, {text:`✅ Equipo armado: *${nombres}*\nEste equipo es el que pelea en *.pokebatalla*`}, {quoted:m})
}
export default handler
