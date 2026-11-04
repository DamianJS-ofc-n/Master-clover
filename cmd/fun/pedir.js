if(!global.bjRooms) global.bjRooms = new Map()
if(!global.bjTimers) global.bjTimers = new Map()
const SUITS = ['♠️','♥️','♦️','♣️']
const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K']
function draw(){ return { rank: RANKS[Math.random()*RANKS.length|0], suit: SUITS[Math.random()*SUITS.length|0] } }
function cardVal(c){ if(['J','Q','K'].includes(c.rank)) return 10; if(c.rank==='A') return 11; return parseInt(c.rank) }
function handVal(h){ let t=0,a=0; for(let c of h){ t+=cardVal(c); if(c.rank==='A') a++; } while(t>21&&a>0){ t-=10; a--; } return t }
function handStr(h){ return h.map(c=>`${c.rank}${c.suit}`).join(' | ') }

async function finishGame(sock,chat){
 const room = global.bjRooms.get(chat)
 if(!room) return
 if(global.bjTimers.has(chat)){ clearTimeout(global.bjTimers.get(chat)); global.bjTimers.delete(chat) }

 let allBusted = room.players.every(p=>p.busted)
 if(!allBusted){ while(handVal(room.dealer) < 17){ room.dealer.push(draw()) } }
 let dv = handVal(room.dealer)

 let txt = `🏁 *RESULTADO FINAL* [${room.id}]\n\n🤖 Banca: ${handStr(room.dealer)} = *${dv}* ${dv>21?'💥 SE PASÓ':''}\n\n`
 for(let p of room.players){
 let pv = handVal(p.hand)
 let res = p.busted ? '❌ *PERDIÓ - BUST*' : dv>21 ? '✅ *GANÓ*' : pv>dv ? `✅ *GANÓ* (${pv} vs ${dv})` : pv===dv ? `😐 *EMPATE* (${pv})` : `❌ *PERDIÓ* (${pv} vs ${dv})`
 txt+=`• @${p.id.split('@')[0]}: ${handStr(p.hand)} = *${pv}* → ${res}\n`
 }

 // RESET para siguiente ronda pero NO borrar sala
 room.dealer=[]
 for(let p of room.players){ p.hand=[]; p.stood=false; p.busted=false }
 room.status='waiting'
 room.turn=0
 room.expiresAt = Date.now() + 6*60*1000

 // timer de sala activa 6 min
 const timer = setTimeout(async ()=>{
 let r = global.bjRooms.get(chat)
 if(r && r.status==='waiting'){
 global.bjRooms.delete(chat)
 global.bjTimers.delete(chat)
 try{ await sock.sendMessage(chat, { text: `⏰ *Sala [${r.id}] cerrada* - 6 min sin jugar` }) }catch{}
 }
 }, 6*60*1000)
 global.bjTimers.set(chat, timer)

 txt+=`\n╭─◈ *ʟᴏᴄᴏꜱ • ʏ • ᴀꜱᴏᴄɪᴀᴅᴏꜱ • ʟʏᴀ*\n> ❀ ʟᴀ ᴘᴀʀᴛɪᴅᴀ sɪɢᴜᴇ ᴀᴄᴛɪᴠᴀ\n> ╭━━❑ *sᴀʟᴀ* ❑\n> | ➤ ᴜɴᴇᴛᴇ » *.joinpartida*\n> | 仝 ᴜsᴜᴀʀɪᴏs ᴀɴᴛᴇʀɪᴏʀᴇs ᴀᴜɴ ᴇɴ sᴀʟᴀ\n> | ➤ sᴀʟɪʀ » *.salirb*\n> ╰━━❏\n╰─◈\n\n👑 Creador: @${room.creator.split('@')[0]} puede usar *.iniciarb* para otra ronda`

 return sock.sendMessage(chat, { text: txt, mentions: room.players.map(p=>p.id).concat([room.creator]) })
}

async function nextTurn(sock,chat){
 const room = global.bjRooms.get(chat)
 if(!room) return
 let pending = room.players.filter(p=>!p.stood && !p.busted)
 if(pending.length===0) return finishGame(sock,chat)
 let next = room.turn+1
 while(next < room.players.length){ let pp=room.players[next]; if(!pp.stood && !pp.busted) break; next++ }
 if(next < room.players.length){
 room.turn=next
 let cur=room.players[next]
 let board=`🃏 *MESA [${room.id}]* - Banca: ${room.dealer[0].rank}${room.dealer[0].suit} | 🃏\n⏱️ Quedan ${Math.ceil((room.expiresAt-Date.now())/60000)} min\n\n`
 board+=room.players.map((p,i)=>{ let st=p.busted?'💥 BUST':p.stood?'🛑 PLANTADO':i===next?'👉 TURNO':'⏳'; return `${i===next?'👉':'•'} @${p.id.split('@')[0]}: ${handStr(p.hand)} = *${handVal(p.hand)}* | ${st}` }).join('\n')
 board+=`\n\n*Turno de @${cur.id.split('@')[0]}*`
 return sock.sendMessage(chat, { text: board, mentions: room.players.map(p=>p.id) })
 }
 let firstPending=room.players.findIndex(p=>!p.stood && !p.busted)
 if(firstPending!==-1){ room.turn=firstPending; let cur=room.players[firstPending]; return sock.sendMessage(chat, { text:`👉 Turno de @${cur.id.split('@')[0]}: ${handStr(cur.hand)} = *${handVal(cur.hand)}*`, mentions:[cur.id] }) }
 return finishGame(sock,chat)
}

export const handler = {}
handler.name = 'pedir'
handler.alias = ['hit','carta','dame']
handler.category = 'fun'
handler.exec = async (sock,m)=>{
 const chat=m.key.remoteJid; const sender=m.key.participant||m.key.remoteJid; const room=global.bjRooms.get(chat); if(!room||room.status!=='playing') return
 let idx=room.players.findIndex(p=>p.id===sender); if(idx===-1) return; if(idx!==room.turn) return sock.sendMessage(chat, { text:`⏳ Turno de @${room.players[room.turn].id.split('@')[0]}`, mentions:[room.players[room.turn].id] }, { quoted: m })
 let p=room.players[idx]; p.hand.push(draw()); let v=handVal(p.hand)
 if(v>21){ p.busted=true; if(room.players.length===1){ return finishGame(sock,chat) } await sock.sendMessage(chat, { text:`💥 @${p.id.split('@')[0]} *BUST ${handStr(p.hand)} = *${v}* - PERDIÓ*`, mentions:[p.id] }, { quoted: m }); return nextTurn(sock,chat) }
 if(v===21){ p.stood=true; await sock.sendMessage(chat, { text:`✨ @${p.id.split('@')[0]} ¡21!`, mentions:[p.id] }, { quoted: m }); return nextTurn(sock,chat) }
 return sock.sendMessage(chat, { text:`🃏 @${p.id.split('@')[0]}: ${handStr(p.hand)} = *${v}*\n.pedir / .plantar`, mentions:[p.id] }, { quoted: m })
}
