import { learnLid, fetchPokemon } from '../../lib/poke.js'
export const handler = {}
handler.name = 'pokeinfo'
handler.alias = ['poke', 'info poke', 'buscarpoke']
handler.category = 'pokemon'
handler.exec = async (sock, m, args) => {
 learnLid(m)
 const jid = m.key.remoteJid
 if(!args[0]) return sock.sendMessage(jid, {text:'❌ Uso: *.pokeinfo pikachu* o *.pokeinfo 25*'}, {quoted:m})
 try{
 let p = await fetchPokemon(args[0].toLowerCase())
 let txt = `> 🔍 *POKEINFO*\n> *❏ 𝐼𝐷:* ${p.id}\n> *✰ 𝑁𝑜𝑚𝑏𝑟𝑒:* ${p.name}\n> *❖ 𝑃𝑒𝑠𝑜:* ${p.peso}\n> *✧ 𝐴𝑙𝑡𝑢𝑟𝑎:* ${p.altura}\n> *✵ 𝑇𝑖𝑝𝑜:* ${p.tipo}\n> *❍ 𝑅𝑎𝑟𝑒𝑧𝑎:* ${p.rare}\n> *✾ 𝑣𝑎𝑙𝑜𝑟:* ${p.valor} PokeCoins\n> *❤️ HP:* ${p.hp} | *⚔️ ATK:* ${p.atk} | *🛡️ DEF:* ${p.def} | *💨 VEL:* ${p.speed}`
 await sock.sendMessage(jid, {image:{url:p.img}, caption: txt}, {quoted:m})
 }catch{ await sock.sendMessage(jid, {text:'❌ No encontré ese pokemon, probá con nombre en inglés: pikachu, charizard, mewtwo'}, {quoted:m}) }
}
export default handler
