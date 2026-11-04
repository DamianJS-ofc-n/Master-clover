if(!global.bjRooms) global.bjRooms = new Map()
if(!global.bjTimers) global.bjTimers = new Map()
const SUITS = ['♠️','♥️','♦️','♣️']
const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K']
function draw(){ return { rank: RANKS[Math.random()*RANKS.length|0], suit: SUITS[Math.random()*SUITS.length|0] } }
function cardVal(c){ if(['J','Q','K'].includes(c.rank)) return 10; if(c.rank==='A') return 11; return parseInt(c.rank) }
function handVal(h){ let t=0,a=0; for(let c of h){ t+=cardVal(c); if(c.rank==='A') a++; } while(t>21&&a>0){ t-=10; a--; } return t }
function handStr(h, hide=false){ if(hide) return `${h[0].rank}${h[0].suit} | 🃏`; return h.map(c=>`${c.rank}${c.suit}`).join(' | ') }

export const handler = {}
handler.name = 'iniciarb'
handler.alias = ['start21','iniciar21','iniciarblackjack','startb']
handler.category = 'fun'
handler.exec = async (sock, m) => {
 const chat = m.key.remoteJid
 const sender = m.key.participant || m.key.remoteJid
 const room = global.bjRooms.get(chat)
 if(!room) return sock.sendMessage(chat, { text:`❌ No hay sala. Usa .partidacreate` }, { quoted: m })
 if(room.creator !== sender) return sock.sendMessage(chat, { text:`❌ Solo @${room.creator.split('@')[0]} puede iniciar`, mentions:[room.creator] }, { quoted: m })
 if(room.status==='playing') return

 // cancelar timer de espera y poner timer de juego 6 min
 if(global.bjTimers.has(chat)) clearTimeout(global.bjTimers.get(chat))

 room.status='playing'
 room.dealer=[draw(),draw()]
 for(let p of room.players){ p.hand=[draw(),draw()] }
 room.turn=0
 room.expiresAt = Date.now() + 6*60*1000

 const timer = setTimeout(async ()=>{
 let r = global.bjRooms.get(chat)
 if(r && r.status==='playing'){
 // forzar fin
 while(handVal(r.dealer) < 17){ r.dealer.push(draw()) }
 let dv = handVal(r.dealer)
 let txt = `⏰ *TIEMPO! 6 MINUTOS TERMINADOS* [${r.id}]\n\n🤖 Banca: ${handStr(r.dealer)} = *${dv}*\n\n📊 Resultados por tiempo:\n`
 for(let p of r.players){
 let pv = handVal(p.hand)
 let res = p.busted ? '❌ PERDIÓ BUST' : dv>21 ? '✅ GANÓ' : pv>dv ? '✅ GANÓ' : pv===dv ? '😐 EMPATE' : '❌ PERDIÓ'
 txt+=`• @${p.id.split('@')[0]}: ${handStr(p.hand)} = *${pv}* → ${res}\n`
 }
 global.bjRooms.delete(chat)
 global.bjTimers.delete(chat)
 try{ await sock.sendMessage(chat, { text: txt, mentions: r.players.map(p=>p.id) }) }catch{}
 }
 }, 6*60*1000)
 global.bjTimers.set(chat, timer)

 let first = room.players[0]
 let txt = `🃏 *BLACKJACK INICIADO* [${room.id}]\n⏱️ Termina en 6 min\n\n🤖 Banca: ${handStr(room.dealer,true)} = ?\n\n`
 txt+= room.players.map((p,i)=>`${room.turn===i?'👉':''} ${p.name} @${p.id.split('@')[0]}: ${handStr(p.hand)} = *${handVal(p.hand)}*`).join('\n')
 txt+= `\n\n*Turno de @${first.id.split('@')[0]}*\n.pedir / .plantar`
 return sock.sendMessage(chat, { text: txt, mentions: room.players.map(p=>p.id) }, { quoted: m })
}
