export const handler = {}
handler.name = 'topgays'
handler.alias = ['topgay','topotakus','toplocos']
handler.category = 'fun'
handler.exec = async (sock,m)=>{
 const chat=m.key.remoteJid
 if(!chat.endsWith('@g.us')) return
 let meta = await sock.groupMetadata(chat)
 let members = meta.participants.map(p=>p.id).sort(()=>0.5-Math.random()).slice(0,10)
 let txt = `🏆 *TOP GAYS DEL GRUPO* 🏳️‍🌈\n\n`
 members.forEach((id,i)=>{ txt+=`${i+1}. @${id.split('@')[0]} - ${Math.floor(Math.random()*100)}% gay\n` })
 return sock.sendMessage(chat, { text: txt, mentions:members }, { quoted: m })
}
