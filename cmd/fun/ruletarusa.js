export const handler = {}
handler.name = 'ruletarusa'
handler.alias = ['ruletar','rusa']
handler.category = 'fun'
handler.exec = async (sock,m)=>{
 const chat=m.key.remoteJid
 const sender=m.key.participant||m.key.remoteJid
 let bala = Math.floor(Math.random()*6)+1
 let tiro = Math.floor(Math.random()*6)+1
 if(bala===tiro){
 return sock.sendMessage(chat, { text: `🔫 *RULETA RUSA*\n\n💥 @${sender.split('@')[0]} ¡BUM! Te tocó la bala\n\n☠️ Moriste`, mentions:[sender] }, { quoted: m })
 } else {
 return sock.sendMessage(chat, { text: `🔫 *RULETA RUSA*\n\n😅 @${sender.split('@')[0]} *CLICK* - Te salvaste (bala en ${bala}, disparaste ${tiro})`, mentions:[sender] }, { quoted: m })
 }
}
