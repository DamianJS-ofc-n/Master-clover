import { loadDB, saveDB, senderCanon, mentionedCanon, getQuotedCanon, learnLid, getUser } from '../../lib/poke.js'
export const handler = {}
handler.name = 'pokebatalla'
handler.alias = ['batalla', 'pelea']
handler.category = 'pokemon'
handler.exec = async (sock, m, args) => {
 learnLid(m)
 const jid = m.key.remoteJid
 const me = senderCanon(m)
 let rivals = mentionedCanon(m)
 let rival = rivals[0] || getQuotedCanon(m)
 if(!rival) return sock.sendMessage(jid, {text:'❌ Mencioná a alguien: *.pokebatalla @usuario*'}, {quoted:m})
 if(rival === me) return sock.sendMessage(jid, {text:'❌ No podés pelear contra vos mismo'}, {quoted:m})
 const db = loadDB()
 const u1 = getUser(db, me)
 const u2 = getUser(db, rival)
 if(!u1.pokes.length) return sock.sendMessage(jid, {text:'❌ Vos no tenés pokes, usá *.pokemon* y *.capturar*'}, {quoted:m})
 if(!u2.pokes.length) return sock.sendMessage(jid, {text:'❌ Tu rival no tiene pokes en este grupo'}, {quoted:m})

 // si tiene equipo armado, usa el primero del equipo, si no el mas fuerte
 let p1 = u1.equipo?.length && u1.pokes[u1.equipo[0]] ? u1.pokes[u1.equipo[0]] : [...u1.pokes].sort((a,b)=>(b.atk+b.hp)-(a.atk+a.hp))[0]
 let p2 = u2.equipo?.length && u2.pokes[u2.equipo[0]] ? u2.pokes[u2.equipo[0]] : [...u2.pokes].sort((a,b)=>(b.atk+b.hp)-(a.atk+a.hp))[0]

 let hp1 = p1.hp*2, hp2 = p2.hp*2
 let max1 = hp1, max2 = hp2
 let log = []
 let turno = p1.speed >= p2.speed ? 1 : 2
 while(hp1 > 0 && hp2 > 0){
 if(turno === 1){
 let dmg = Math.max(5, p1.atk - Math.floor(p2.def/2) + Math.floor(Math.random()*10))
 hp2 = Math.max(0, hp2 - dmg)
 log.push(`> 🗡️ *${p1.name}* golpea con ${dmg} de daño\n> ❤️ *${p2.name}* queda en ${hp2}/${max2} HP`)
 turno = 2
 } else {
 let dmg = Math.max(5, p2.atk - Math.floor(p1.def/2) + Math.floor(Math.random()*10))
 hp1 = Math.max(0, hp1 - dmg)
 log.push(`> 🗡️ *${p2.name}* golpea con ${dmg} de daño\n> ❤️ *${p1.name}* queda en ${hp1}/${max1} HP`)
 turno = 1
 }
 if(log.length >= 12) break
 }

 let ganoYo = hp1 > hp2
 if(ganoYo){ u1.wins++; u2.losses++; u1.pokeCoins += 50 } else { u2.wins++; u1.losses++; u2.pokeCoins += 50 }
 saveDB(db)

 let txt = `> ❀ 𝑃𝑂𝐾𝐸𝐵𝐴𝑇𝐴𝐿𝐿𝐴\n> *❏ 𝑅𝐸𝑇𝐴𝐷𝑂𝑅:* @${me}\n> *❏ 𝑅𝐼𝑉𝐴𝐿:* @${rival}\n=========\n> ❏ pokemon: *${p1.name}*\n> *✵ 𝑇𝑖𝑝𝑜:* ${p1.tipo}\n> *❍ 𝑅𝑎𝑟𝑒𝑧𝑎:* ${p1.rare}\n> *❤️ 𝐻𝑃:* ${max1} | *⚔️ 𝐴𝑇𝐾:* ${p1.atk} | *🛡️ 𝐷𝐸𝐹:* ${p1.def}\n=========\n> ❏ pokemon: *${p2.name}*\n> *✵ 𝑇𝑖𝑝𝑜:* ${p2.tipo}\n> *❍ 𝑅𝑎𝑟𝑒𝑧𝑎:* ${p2.rare}\n> *❤️ 𝐻𝑃:* ${max2} | *⚔️ 𝐴𝑇𝐾:* ${p2.atk} | *🛡️ 𝐷𝐸𝐹:* ${p2.def}\n=========\n> ⚔️ *𝑅𝑒𝑠𝑢𝑙𝑡𝑎𝑑𝑜:*\n${log.join('\n---------\n')}\n=========\n> ${ganoYo ? `🏆 *𝐺𝑎𝑛𝑎𝑑𝑜𝑟:* @${me} con *${p1.name}*` : `🏆 *𝐺𝑎𝑛𝑎𝑑𝑜𝑟:* @${rival} con *${p2.name}*`}\n> *✤ 𝑃𝑟𝑒𝑚𝑖𝑜:* +50 PokeCoins\n> *❏ 𝑀𝑎𝑟𝑐𝑎𝑑𝑜𝑟:* @${me} ${u1.wins}W - ${u1.losses}L | @${rival} ${u2.wins}W - ${u2.losses}L`

 await sock.sendMessage(jid, {text: txt, mentions:[me+'@s.whatsapp.net', rival+'@s.whatsapp.net']}, {quoted:m})
}
export default handler
