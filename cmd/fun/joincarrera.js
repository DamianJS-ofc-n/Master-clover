import { ensureDB, isRegistered, formatMoney, COIN } from '../../core/economy.js'

if(!global.carreraRooms) global.carreraRooms = new Map()
if(!global.carreraTimers) global.carreraTimers = new Map()

function sleep(ms){ return new Promise(r=>setTimeout(r,ms)) }

export const handler = {}
handler.name = 'joincarrera'
handler.alias = ['unirsecarrera','join','joinc','entrarcarrera']
handler.category = 'fun'

handler.exec = async (sock, m) => {
 const chat = m.key.remoteJid
 const sender = m.key.participant || m.key.remoteJid
 const senderNum = sender.split('@')[0]

 if(!isRegistered(senderNum) && !isRegistered(sender)){
 return sock.sendMessage(chat, { text: `✳️ Registrate primero con .reg` }, { quoted: m })
 }

 let room = global.carreraRooms.get(chat)
 if(!room) return sock.sendMessage(chat, { text: `❌ No hay carrera creada. Usa .carreracrear <apuesta>` }, { quoted: m })
 if(room.status!=='waiting') return sock.sendMessage(chat, { text: `❌ La carrera ya empezó` }, { quoted: m })
 if(room.players.find(p=>p.id===sender)) return sock.sendMessage(chat, { text: `⚠️ Ya estás en la carrera [${room.id}]` }, { quoted: m })
 if(room.players.length>=2) return sock.sendMessage(chat, { text: `❌ Carrera llena 2/2` }, { quoted: m })

 let userDB = ensureDB(senderNum) || ensureDB(sender)
 let creatorDB = ensureDB(room.players[0].num) || ensureDB(room.players[0].id)

 if((userDB.money||0) < room.bet){
 return sock.sendMessage(chat, { text: `❌ @${sender.split('@')[0]} no te alcanza\nTienes: ${formatMoney(userDB.money||0)} ${COIN}\nNecesitas: ${formatMoney(room.bet)} ${COIN}`, mentions:[sender] }, { quoted: m })
 }
 if((creatorDB.money||0) < room.bet){
 global.carreraRooms.delete(chat)
 if(global.carreraTimers.has(chat)){ clearTimeout(global.carreraTimers.get(chat)); global.carreraTimers.delete(chat) }
 return sock.sendMessage(chat, { text: `❌ El creador @${room.players[0].id.split('@')[0]} ya no tiene coins. Carrera cancelada.`, mentions:[room.players[0].id] }, { quoted: m })
 }

 room.players.push({ id: sender, num: senderNum, name: m.pushName || 'Jugador' })

 if(global.carreraTimers.has(chat)){ clearTimeout(global.carreraTimers.get(chat)); global.carreraTimers.delete(chat) }

 // DESCONTAR APUESTAS
 creatorDB.money -= room.bet
 userDB.money -= room.bet
 global.saveDB?.()

 const pot = room.bet * 2

 // ANIMACION CARRERA
 await sock.sendMessage(chat, { text: `✅ @${sender.split('@')[0]} se unió! Apuesta verificada: ${formatMoney(room.bet)} ${COIN}\n\n💰 Pozo: *${formatMoney(pot)} ${COIN}*\n\n🐎 *LA CARRERA EMPIEZA EN 3...*`, mentions:[sender, room.players[0].id] }, { quoted: m })
 await sleep(1500)
 await sock.sendMessage(chat, { text: `🐎 2... 🏇💨` }, { quoted: m })
 await sleep(1200)
 await sock.sendMessage(chat, { text: `🏁 1... ¡YA!` }, { quoted: m })
 await sleep(1000)

 const horses = ['🐴','🐎']
 const pista = 10
 let p1Pos = 0, p2Pos = 0
 let winner = null
 
 // simular carrera
 while(p1Pos < pista && p2Pos < pista){
 if(Math.random()>0.5) p1Pos++
 else p2Pos++
 }
 winner = p1Pos >= pista ? room.players[0] : room.players[1]
 let loser = winner.id === room.players[0].id ? room.players[1] : room.players[0]

 // PREMIO
 let winnerDB = ensureDB(winner.num) || ensureDB(winner.id)
 winnerDB.money += pot
 global.saveDB?.()

 let track1 = '—'.repeat(p1Pos) + horses[0] + '—'.repeat(pista-p1Pos)
 let track2 = '—'.repeat(p2Pos) + horses[1] + '—'.repeat(pista-p2Pos)

 let txt = `🏁 *CARRERA FINALIZADA* [${room.id}]\n\n`
 txt += `🏇 @${room.players[0].id.split('@')[0]}: ${track1}\n`
 txt += `🏇 @${room.players[1].id.split('@')[0]}: ${track2}\n\n`
 txt += `💰 Pozo: *${formatMoney(pot)} ${COIN}*\n\n`
 txt += `🏆 *GANADOR: @${winner.id.split('@')[0]}*\n`
 txt += `💸 Se lleva *${formatMoney(pot)} ${COIN}*\n`
 txt += `😢 @${loser.id.split('@')[0]} perdió *${formatMoney(room.bet)}*\n\n`
 txt += `╭─◈ *ʟᴏᴄᴏꜱ • ʏ • ᴀꜱᴏᴄɪᴀᴅᴏꜱ • ʟʏᴀ*\n`
 txt += `> ❀ ᴄʀᴇᴀ ᴏᴛʀᴀ » *.carreracrear <apuesta>*\n`
 txt += `> ╰━━❏\n╰─◈`

 global.carreraRooms.delete(chat)
 
 return sock.sendMessage(chat, { text: txt, mentions: room.players.map(p=>p.id) }, { quoted: m })
}
