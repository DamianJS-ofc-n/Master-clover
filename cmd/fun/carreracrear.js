import { ensureDB, isRegistered, formatMoney, COIN } from '../../core/economy.js'

if(!global.carreraRooms) global.carreraRooms = new Map()
if(!global.carreraTimers) global.carreraTimers = new Map()

export const handler = {}
handler.name = 'carreracrear'
handler.alias = ['crearcarrera','carrera','crearc']
handler.category = 'fun'

handler.exec = async (sock, m, args) => {
 const chat = m.key.remoteJid
 const sender = m.key.participant || m.key.remoteJid
 const senderNum = sender.split('@')[0]

 if(!isRegistered(senderNum) && !isRegistered(sender)){
 return sock.sendMessage(chat, { text: `✳️ Registrate primero con .reg` }, { quoted: m })
 }

 let room = global.carreraRooms.get(chat)
 if(room){
 return sock.sendMessage(chat, { text: `⚠️ Ya hay carrera [${room.id}] apuesta *${formatMoney(room.bet)} ${COIN}* - ${room.players.length}/2\n\nCreador: @${room.creator.split('@')[0]}\nUnirse: .joincarrera`, mentions:[room.creator] }, { quoted: m })
 }

 let bet = parseInt(args[0]?.replace(/[^0-9]/g,'') || '0')
 if(!bet || bet < 100){
 return sock.sendMessage(chat, { text: `🐎 *CARRERA DE CABALLOS*\n\nUso: .carreracrear <apuesta>\nEj: .carreracrear 500\n\nMínimo 100 coins` }, { quoted: m })
 }

 let userDB = ensureDB(senderNum) || ensureDB(sender)
 if(!userDB || (userDB.money||0) < bet){
 return sock.sendMessage(chat, { text: `❌ @${sender.split('@')[0]} no tienes suficiente\nTienes: ${formatMoney(userDB?.money||0)} ${COIN}\nApuesta: ${formatMoney(bet)} ${COIN}`, mentions:[sender] }, { quoted: m })
 }

 const id = Math.random().toString(36).slice(2,5).toUpperCase()
 const newRoom = {
 id, chat, creator: sender, bet,
 players: [{ id: sender, num: senderNum, name: m.pushName || 'Jugador' }],
 status: 'waiting',
 createdAt: Date.now(),
 expiresAt: Date.now() + 3*60*1000
 }
 global.carreraRooms.set(chat, newRoom)

 // expirar en 3 min si nadie se une
 if(global.carreraTimers.has(chat)) clearTimeout(global.carreraTimers.get(chat))
 const timer = setTimeout(async ()=>{
 let r = global.carreraRooms.get(chat)
 if(r && r.status==='waiting'){
 global.carreraRooms.delete(chat)
 global.carreraTimers.delete(chat)
 try{ await sock.sendMessage(chat, { text: `⏰ Carrera [${r.id}] expiró - nadie se unió` }) }catch{}
 }
 }, 3*60*1000)
 global.carreraTimers.set(chat, timer)

 return sock.sendMessage(chat, { 
 text: `🐎 *CARRERA CREADA* [${id}]\n\n👑 Creador: @${sender.split('@')[0]}\n💰 Apuesta: *${formatMoney(bet)} ${COIN}*\n👥 1/2\n\n📥 Otro jugador: .joincarrera\n⏱️ Dura 3 min\n\nEl bot verificará que tengan coins antes de unirse`, 
 mentions:[sender] 
 }, { quoted: m })
}
