import { loadDB, saveDB, senderCanon, learnLid, fetchPokemon } from '../../lib/poke.js'
export const handler = {}
handler.name = 'pokemon'
handler.alias = ['invocar', 'spawn', 'invocar pokemon', 'poke']
handler.category = 'pokemon'
handler.exec = async (sock, m, args) => {
 learnLid(m)
 const jid = m.key.remoteJid
 if(!jid.endsWith('@g.us')) return sock.sendMessage(jid, {text:'❌ Solo en grupos'}, {quoted:m})
 const db = loadDB()
 if(db.spawns[jid] && Date.now() - db.spawns[jid].at < 60000){
 return sock.sendMessage(jid, {text:`⚠️ Ya hay un *${db.spawns[jid].poke.name}* salvaje, usá *.capturar*`}, {quoted:m})
 }
 let poke = await fetchPokemon()
 db.spawns[jid] = { poke, at: Date.now(), by: senderCanon(m) }
 saveDB(db)
 let txt = `> ❀ Te salio *(${poke.name})*\n> *❏ 𝐼𝐷* : ${poke.id}\n> *✰ 𝑁𝑜𝑚𝑏𝑟𝑒:* ${poke.name}\n> *❖ 𝑃𝑒𝑠𝑜:* ${poke.peso}\n> *✧ 𝐴𝑙𝑡𝑢𝑟𝑎:* ${poke.altura}\n> *✵ 𝑇𝑖𝑝𝑜:* ${poke.tipo}\n> *✤ 𝑃𝑜𝑘𝑒𝑏𝑜𝑙𝑎𝑠:* Necesitas pokebolas\n> *❍ 𝑅𝑎𝑟𝑒𝑧𝑎:* ${poke.rare}\n> *✾ 𝑣𝑎𝑙𝑜𝑟:* ${poke.valor} PokeCoins\n=========\n> ❏ 𝑃𝑢𝑒𝑑𝑒𝑠 𝑟𝑒𝑐𝑙𝑎𝑚𝑎𝑟 𝑒𝑠𝑡𝑒 𝑃𝑜𝑘𝑜𝑚𝑜𝑛 𝑐𝑜𝑛 *.capturar* 𝑒𝑠𝑡𝑒 𝑝𝑜𝑘𝑒𝑚𝑜𝑛 𝑠𝑒 𝑝𝑢𝑒𝑑𝑒 𝑟𝑜𝑏𝑎𝑟 𝑎𝑡𝑟á𝑝𝑎𝑙𝑜 𝑟á𝑝𝑖𝑑𝑜 ฅ⁠^⁠•⁠ﻌ⁠•⁠^⁠ฅ`
 await sock.sendMessage(jid, {image:{url:poke.img}, caption: txt}, {quoted:m})
}
export default handler
