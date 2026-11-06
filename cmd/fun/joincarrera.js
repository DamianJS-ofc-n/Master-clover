import { formatMoney, COIN } from '../../core/economy.js'
import { getUser as getUserLib, updateUser } from '../../lib/db.js'

if(!global.carreraRooms) global.carreraRooms = new Map()
if(!global.carreraTimers) global.carreraTimers = new Map()
const sleep = ms=>new Promise(r=>setTimeout(r,ms))

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
 try{
 const { ensureDB } = await import('../../core/economy.js')
 for(let id of ids){
 try{
 let d = ensureDB(id)
 if(d && (d.money||0) > best.money){ best = { money: d.money||0, db: d, id, type: 'core' } }
 }catch{}
 }
 }catch{}
 for(let id of ids){
 try{
 let u = await getUserLib(id.replace('@s.whatsapp.net','').replace('@lid',''))
 if(u && (u.money||u.coins||0) > best.money){ best = { money: u.money||u.coins||0, db: u, id, type: 'lib' } }
 }catch{}
 }
 return best
}

async function subMoney(info, amount){
 if(info.type==='core'){ info.db.money -= amount; global.saveDB?.() }
 else if(info.type==='lib'){ await updateUser(info.id.replace('@s.whatsapp.net','').replace('@lid',''), { money: (info.db.money||0) - amount }) }
}
async function addMoney(info, amount){
 if(info.type==='core'){ info.db.money += amount; global.saveDB?.() }
 else if(info.type==='lib'){ await updateUser(info.id.replace('@s.whatsapp.net','').replace('@lid',''), { money: (info.db.money||0) + amount }) }
}

export const handler = {}
handler.name = 'joincarrera'
handler.alias = ['joinc','join','entrarcarrera']
handler.category = 'fun'

handler.exec = async (sock, m) => {
 const chat = m.key.remoteJid
 const rawSender = m.key.participant || m.participant || m.key.remoteJid
 let room = global.carreraRooms.get(chat)
 if(!room) return sock.sendMessage(chat, { text:`❌ No hay carrera. Usa .carrera 100` }, { quoted: m })

 let ids = await resolveIds(sock, chat, rawSender)
 let userInfo = await getMoneyEverywhere(ids)
 let creatorInfo = await getMoneyEverywhere(room.creatorIds)

 // refresca creator money
 creatorInfo = await getMoneyEverywhere(room.creatorIds)

 if(userInfo.money < room.bet) return sock.sendMessage(chat, { text:`❌ @${rawSender.split('@')[0]} no te alcanza: ${formatMoney(userInfo.money)} / ${formatMoney(room.bet)}`, mentions:[rawSender] }, { quoted: m })
 if(creatorInfo.money < room.bet){ global.carreraRooms.delete(chat); return sock.sendMessage(chat, { text:`❌ Creador sin plata, cancelada` }, { quoted: m }) }

 room.players.push({ id: rawSender, ids, dbInfo: userInfo })
 if(global.carreraTimers.has(chat)){ clearTimeout(global.carreraTimers.get(chat)); global.carreraTimers.delete(chat) }

 await subMoney(userInfo, room.bet)
 // re-obtener creator porque cambió
 let creatorFresh = await getMoneyEverywhere(room.creatorIds)
 await subMoney(creatorFresh, room.bet)

 const pot = room.bet*2
 await sock.sendMessage(chat, { text:`✅ @${rawSender.split('@')[0]} se unió! Pozo ${formatMoney(pot)}\n🐎 3...`, mentions:[rawSender, room.creator] })
 await sleep(1200); await sock.sendMessage(chat, { text:`🏇 2...` })
 await sleep(1000); await sock.sendMessage(chat, { text:`🏁 ¡YA!` })
 await sleep(800)

 let p1=0,p2=0, pista=10
 while(p1<pista && p2<pista){ Math.random()>0.5 ? p1++ : p2++ }
 let winner = p1>=pista ? room.players[0] : room.players[1]

 let winnerFresh = await getMoneyEverywhere(winner.ids || [winner.id])
 await addMoney(winnerFresh, pot)

 let t1='—'.repeat(p1)+'🐴'+'—'.repeat(pista-p1)
 let t2='—'.repeat(p2)+'🐎'+'—'.repeat(pista-p2)

 let txt=`🏁 *CARRERA [${room.id}]*\n\n🏇 @${room.players[0].id.split('@')[0]}: ${t1}\n🏇 @${room.players[1].id.split('@')[0]}: ${t2}\n\n💰 Pozo ${formatMoney(pot)} ${COIN}\n🏆 GANÓ @${winner.id.split('@')[0]}!\n\n╭─◈ *ʟᴏᴄᴏꜱ • ʏ • ᴀꜱᴏᴄɪᴀᴅᴏꜱ • ʟʏᴀ*\n> ❀ ᴄʀᴇᴀ ᴏᴛʀᴀ » *.carrera <apuesta>*\n╰─◈`
 global.carreraRooms.delete(chat)
 return sock.sendMessage(chat, { text: txt, mentions: room.players.map(p=>p.id) })
}
