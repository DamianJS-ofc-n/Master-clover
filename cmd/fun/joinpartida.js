if(!global.bjRooms) global.bjRooms = new Map()
function getName(m){ return m.pushName || 'Jugador' }

export const handler = {}
handler.name = 'joinpartida'
handler.alias = ['unirse21','join21','entrar21','unirseb']
handler.category = 'fun'
handler.exec = async (sock, m) => {
 const chat = m.key.remoteJid
 const sender = m.key.participant || m.key.remoteJid
 const room = global.bjRooms.get(chat)
 if(!room) return sock.sendMessage(chat, { text: `❌ No hay sala creada\nUsa .partidacreate para crear una` }, { quoted: m })
 if(room.status==='playing') return sock.sendMessage(chat, { text: `❌ La partida ya empezó, esperá que termine` }, { quoted: m })
 if(room.players.find(p=>p.id===sender)) return sock.sendMessage(chat, { text: `⚠️ Ya estás en la sala [${room.id}] - ${room.players.length}/4` }, { quoted: m })
 if(room.players.length>=4) return sock.sendMessage(chat, { text: `❌ Sala llena 4/4` }, { quoted: m })

 room.players.push({ id: sender, name: getName(m), hand:[], stood:false, busted:false })
 return sock.sendMessage(chat, {
 text: `✅ *TE UNISTE A LA SALA* [${room.id}]\n\n👤 @${sender.split('@')[0]} se unió\n👥 Jugadores: ${room.players.length}/4\n\n${room.players.map((p,i)=>`${i+1}. @${p.id.split('@')[0]}`).join('\n')}\n\n⏳ Esperando .iniciarb del creador @${room.creator.split('@')[0]}`,
 mentions: [...room.players.map(p=>p.id), room.creator]
 }, { quoted: m })
}
