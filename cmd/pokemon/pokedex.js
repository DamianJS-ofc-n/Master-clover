import { loadDB, senderCanon, learnLid, getUser } from '../../lib/poke.js'
export const handler = {}
handler.name = 'pokedex'
handler.alias = ['mispokes', 'mis pokes', 'mochila', 'mis pokemons', 'dex']
handler.category = 'pokemon'
handler.exec = async (sock, m, args) => {
 learnLid(m)
 const jid = m.key.remoteJid
 const me = senderCanon(m)
 const db = loadDB()
 const user = getUser(db, me)
 if(!user.pokes.length) return sock.sendMessage(jid, {text:`> ❀ 𝑃𝑂𝐾𝐷𝐸𝑋 𝐷𝐸 @${me}\n> *❏ 𝐶𝑂𝐼𝑁𝑆*: 0\n> *✰ 𝑃𝑂𝐾𝐸𝑀𝑂𝑁𝑆:* 0\n=========\n> ❌ No tenés pokes todavía\n> Usá *.pokemon* y *.capturar* para empezar ฅ⁠^⁠•⁠ﻌ⁠•⁠^⁠ฅ`}, {quoted:m, mentions:[me+'@s.whatsapp.net']})

 let lista = user.pokes.map((p,i)=>{
 return `> ❏ pokemon: *${p.name}*\n> *❏ 𝐼𝐷:* #${p.id}\n> *✵ 𝑇𝑖𝑝𝑜:* ${p.tipo}\n> *❍ 𝑅𝑎𝑟𝑒𝑧𝑎:* ${p.rare}\n> *❤️ 𝐻𝑃:* ${p.hp} | *⚔️ 𝐴𝑇𝐾:* ${p.atk} | *🛡️ 𝐷𝐸𝐹:* ${p.def}\n> ✤ valor: ${p.valor} PokeCoins`
 }).join('\n=========\n')

 let txt = `> ❀ 𝑃𝑂𝐾𝐷𝐸𝑋 𝐷𝐸 @${me}\n> *❏ 𝐶𝑂𝐼𝑁𝑆*: ${user.pokeCoins}\n> *✰ 𝑃𝑂𝐾𝐸𝑀𝑂𝑁𝑆:* ${user.pokes.length}\n> *🏆 𝑉𝑖𝑐𝑡𝑜𝑟𝑖𝑎𝑠:* ${user.wins} | *💀 𝐷𝑒𝑟𝑟𝑜𝑡𝑎𝑠:* ${user.losses}\n> *🎒 𝐵𝑎𝑙𝑙𝑠:* Pokeball ${user.balls.pokeball} | Super ${user.balls.superball} | Ultra ${user.balls.ultraball} | Master ${user.balls.masterball}\n=========\n${lista}\n=========\n> ❏ 𝑉𝑒𝑛𝑑𝑒 𝑐𝑜𝑛 *.venderpoke <numero>*\n> ❏ 𝐴𝑟𝑚𝑎 𝑡𝑢 𝑒𝑞𝑢𝑖𝑝𝑜 𝑐𝑜𝑛 *.pokequipo 1 2 3*`

 await sock.sendMessage(jid, {text: txt, mentions:[me+'@s.whatsapp.net']}, {quoted:m})
}
export default handler
