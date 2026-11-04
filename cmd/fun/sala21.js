if(!global.bjRooms) global.bjRooms = new Map()
if(!global.bjTimers) global.bjTimers = new Map()
const SUITS = ['♠️','♥️','♦️','♣️']
const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K']
function draw(){ return { rank: RANKS[Math.random()*RANKS.length|0], suit: SUITS[Math.random()*SUITS.length|0] } }
function cardVal(c){ if(['J','Q','K'].includes(c.rank)) return 10; if(c.rank==='A') return 11; return parseInt(c.rank) }
function handVal(h){ let t=0,a=0; for(let c of h){ t+=cardVal(c); if(c.rank==='A') a++; } while(t>21&&a>0){ t-=10; a--; } return t }
function handStr(h, hide=false){ if(hide) return `${h[0].rank}${h[0].suit} | 🃏`; return h.map(c=>`${c.rank}${c.suit}`).join(' | ') }
function getName(m){ return m.pushName || 'Jugador' }

export const handler = {}
handler.name = 'partidacreate'
handler.alias = ['crearb','crearsala21','crear21']
handler.category = 'fun'
handler.exec = async (sock, m) => {
 const chat = m.key.remoteJid
 const sender = m.key.participant || m.key.remoteJid
 let room = global.bjRooms.get(chat)
 if(room){
 return sock.sendMessage(chat, { text: `⚠️ Ya hay sala [${room.id}] - quedan ${Math.ceil((room.expiresAt - Date.now())/60000)} min\n👥: ${room.players.map(p=>`@${p.id.split('@')[0]}`).join(', ')}`, mentions: room.players.map(p=>p.id) }, { quoted: m })
 }
 
 const expiresAt = Date.now() + 6*60*1000
 const newRoom = { id: Math.random().toString(36).slice(2,6).toUpperCase(), chat, creator: sender, players: [{ id: sender, name: getName(m), hand:[], stood:false, busted:false }], status:'waiting', dealer:[], turn:0, expiresAt, createdAt: Date.now() }
 global.bjRooms.set(chat, newRoom)

 // timer 6 min para sala en espera
 if(global.bjTimers.has(chat)) clearTimeout(global.bjTimers.get(chat))
 const timer = setTimeout(async ()=>{
 let r = global.bjRooms.get(chat)
 if(r && r.status==='waiting'){
 global.bjRooms.delete(chat)
 global.bjTimers.delete(chat)
 try{ await sock.sendMessage(chat, { text: `⏰ *Sala [${r.id}] expiró* - 6 minutos sin iniciar. Usa .partidacreate para crear otra.` }) }catch{}
 }
 }, 6*60*1000)
 global.bjTimers.set(chat, timer)

 await sock.sendMessage(chat, { text: `🃏 *SALA CREADA* [${newRoom.id}]\n\n👑 Creador: @${sender.split('@')[0]}\n👥 1/4\n⏱️ Dura 6 minutos\n\n📥 .joinpartida para unirse\n▶️ .iniciarb para iniciar`, mentions:[sender] }, { quoted: m })
}
