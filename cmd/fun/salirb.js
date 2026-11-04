if(!global.bjRooms) global.bjRooms = new Map()
if(!global.bjTimers) global.bjTimers = new Map()
export const handler = {}
handler.name = 'salirb'
handler.alias = ['salir21','leaveb','salirblackjack']
handler.category = 'fun'
handler.exec = async (sock,m)=>{
 const chat=m.key.remoteJid
 const sender=m.key.participant||m.key.remoteJid
 const room=global.bjRooms.get(chat)
 if(!room) return sock.sendMessage(chat, { text:`❌ No hay sala activa` }, { quoted: m })
 let idx=room.players.findIndex(p=>p.id===sender)
 if(idx===-1) return sock.sendMessage(chat, { text:`❌ No estás en la sala [${room.id}]` }, { quoted: m })
 room.players.splice(idx,1)
 if(room.players.length===0){
 if(global.bjTimers.has(chat)){ clearTimeout(global.bjTimers.get(chat)); global.bjTimers.delete(chat) }
 global.bjRooms.delete(chat)
 return sock.sendMessage(chat, { text:`👋 @${sender.split('@')[0]} salió - Sala [${room.id}] cerrada (vacía)`, mentions:[sender] }, { quoted: m })
 }
 if(room.creator===sender){
 room.creator=room.players[0].id
 await sock.sendMessage(chat, { text:`👋 @${sender.split('@')[0]} (creador) salió\n👑 Nuevo creador: @${room.creator.split('@')[0]}\n\n╭─◈ *ʟᴏᴄᴏꜱ • ʏ • ᴀꜱᴏᴄɪᴀᴅᴏꜱ • ʟʏᴀ*\n> ❀ ʟᴀ ᴘᴀʀᴛɪᴅᴀ sɪɢᴜᴇ ᴀᴄᴛɪᴠᴀ\n> ╭━━❑ *sᴀʟᴀ* ❑\n> | ➤ ᴜɴᴇᴛᴇ » *.joinpartida*\n> | 仝 ᴜsᴜᴀʀɪᴏs ᴀɴᴛᴇʀɪᴏʀᴇs ᴀᴜɴ ᴇɴ sᴀʟᴀ\n> | ➤ sᴀʟɪʀ » *.salirb*\n> ╰━━❏\n╰─◈`, mentions:[sender, room.creator] }, { quoted: m })
 } else {
 return sock.sendMessage(chat, { text:`👋 @${sender.split('@')[0]} salió de la sala [${room.id}]\n👥 Quedan: ${room.players.length}/4`, mentions:[sender] }, { quoted: m })
 }
}
