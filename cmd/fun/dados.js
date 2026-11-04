export const handler = {}
handler.name = 'dados'
handler.alias = ['dado','dice','roll']
handler.category = 'fun'
handler.exec = async (sock, m) => {
 const chat = m.key.remoteJid
 const sender = m.key.participant || m.key.remoteJid
 let target = m.mentionedJid?.[0] || null
 let d1 = Math.floor(Math.random()*6)+1
 let d2 = Math.floor(Math.random()*6)+1
 const faces = ['','⚀','⚁','⚂','⚃','⚄','⚅']
 
 if(!target){
 return sock.sendMessage(chat, { text: `🎲 @${sender.split('@')[0]} tiró: ${faces[d1]} *${d1}*\n\nMenciona a alguien para duelo: .dados @usuario`, mentions:[sender] }, { quoted: m })
 }
 
 let txt = `🎲 *DUELO DE DADOS*\n\n`
 txt += `@${sender.split('@')[0]}: ${faces[d1]} *${d1}*\n`
 txt += `@${target.split('@')[0]}: ${faces[d2]} *${d2}*\n\n`
 if(d1>d2) txt += `🏆 Gana @${sender.split('@')[0]}!`
 else if(d2>d1) txt += `🏆 Gana @${target.split('@')[0]}!`
 else txt += `😐 Empate!`
 
 return sock.sendMessage(chat, { text: txt, mentions:[sender, target] }, { quoted: m })
}
