import { formatMoney, COIN } from '../../core/economy.js'
import { getUser as getUserLib } from '../../lib/db.js'

if(!global.carreraRooms) global.carreraRooms = new Map()
if(!global.carreraTimers) global.carreraTimers = new Map()

async function resolveIds(sock, chat, rawId){
 let ids = [rawId, rawId.split('@')[0]]
 let num = rawId.split('@')[0]
 try{
 if(sock.groupMetadata && chat.endsWith('@g.us')){
 const meta = await sock.groupMetadata(chat)
 for(const p of meta.participants||[]){
 if(p.lid?.split('@')[0]===num || p.id===rawId){
 if(p.id) ids.push(p.id)
 if(p.phoneNumber) ids.push(p.phoneNumber, p.phoneNumber.split('@')[0])
 if(p.lid) ids.push(p.lid, p.lid.split('@')[0])
 }
 if(p.phoneNumber===rawId || p.id===rawId){
 if(p.lid) ids.push(p.lid)
 }
 }
 }
 const map = sock.signalRepository?.lidMapping
 if(map?.getPNForLID){
 try{ const pn = await map.getPNForLID(rawId); if(pn){ ids.push(pn, pn.split('@')[0]) } }catch{}
 }
 }catch{}
 return [...new Set(ids)]
}

async function getMoneyEverywhere(ids){
 let best = { money: 0, db: null, id: null, type: '' }
 // 1. core/economy
 try{
 const { ensureDB } = await import('../../core/economy.js')
 for(let id of ids){
 try{
 let d = ensureDB(id)
 if(d && (d.money||0) > best.money){ best = { money: d.money||0, db: d, id, type: 'core' } }
 }catch{}
 }
 }catch{}
 // 2. lib/db
 for(let id of ids){
 try{
 let u = await getUserLib(id.replace('@s.whatsapp.net','').replace('@lid',''))
 if(u && (u.money||u.coins||0) > best.money){ best = { money: u.money||u.coins||0, db: u, id, type: 'lib' } }
 }catch{}
 }
 return best
}

export const handler = {}
handler.name = 'carreracrear'
handler.alias = ['crearcarrera','carrera','crearc']
handler.category = 'fun'

handler.exec = async (sock, m, args) => {
 const chat = m.key.remoteJid
 const rawSender = m.key.participant || m.participant || m.key.remoteJid
 let ids = await resolveIds(sock, chat, rawSender)

 if(global.carreraRooms.get(chat)){
 let r = global.carreraRooms.get(chat)
 return sock.sendMessage(chat, { text: `⚠️ Ya hay carrera [${r.id}] apuesta ${formatMoney(r.bet)} ${COIN}\n.joincarrera para unirse` }, { quoted: m })
 }

 let bet = parseInt(args[0]?.replace(/[^0-9]/g,'')||'0')
 if(bet < 100) return sock.sendMessage(chat, { text: `🐎 *CARRERA*\nUso: .carrera 100\nMin 100` }, { quoted: m })

 let { money, db, type, id } = await getMoneyEverywhere(ids)
 
 if(money < bet){
 return sock.sendMessage(chat, { text: `❌ @${rawSender.split('@')[0]} no tienes suficiente\nTienes: ${formatMoney(money)} ${COIN} (${type||'no encontrado'})\nApuesta: ${formatMoney(bet)}\n\nTu bal dice 4563 pero tu economy está en otro ID, esto busca en todos: ${ids.length} ids`, mentions:[rawSender] }, { quoted: m })
 }

 const idRoom = Math.random().toString(36).slice(2,5).toUpperCase()
 global.carreraRooms.set(chat, { id: idRoom, chat, creator: rawSender, creatorIds: ids, creatorDBInfo: { money, db, type, id }, bet, players: [{ id: rawSender, ids, dbInfo: { money, db, type, id } }], status:'waiting' })
 
 if(global.carreraTimers.has(chat)) clearTimeout(global.carreraTimers.get(chat))
 const t = setTimeout(()=>{ global.carreraRooms.delete(chat); global.carreraTimers.delete(chat) }, 3*60*1000)
 global.carreraTimers.set(chat,t)

 return sock.sendMessage(chat, { text: `🐎 *CARRERA CREADA* [${idRoom}]\n👑 @${rawSender.split('@')[0]} - Tienes ${formatMoney(money)} ${COIN}\n💰 Apuesta: ${formatMoney(bet)}\n👥 1/2\n\n📥 .joincarrera`, mentions:[rawSender] }, { quoted: m })
}
