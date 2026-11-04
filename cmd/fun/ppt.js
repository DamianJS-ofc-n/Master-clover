export const handler = {}
handler.name = 'ppt'
handler.alias = ['piedra','papel','tijera']
handler.category = 'fun'
handler.exec = async (sock,m,args)=>{
 const opt = ['piedra','papel','tijera']
 let user = (args[0]||'').toLowerCase()
 if(!opt.includes(user)) return sock.sendMessage(m.key.remoteJid, { text: `✊✋✌️ *PPT*\n\nUso: .ppt piedra / papel / tijera` }, { quoted: m })
 let bot = opt[Math.floor(Math.random()*3)]
 let res = user===bot ? '😐 Empate' : (user==='piedra'&&bot==='tijera')||(user==='papel'&&bot==='piedra')||(user==='tijera'&&bot==='papel') ? '✅ Ganaste' : '❌ Perdiste'
 return sock.sendMessage(m.key.remoteJid, { text: `Tú: *${user}*\nBot: *${bot}*\n\n${res}` }, { quoted: m })
}
