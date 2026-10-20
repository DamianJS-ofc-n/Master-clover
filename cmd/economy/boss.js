import { ensureDB, canUse, setCooldown, addMoney, formatTime, comicBox, isRegistered } from '../../core/economy.js'
export const handler = {}; handler.name='boss'; handler.category='Economy'
handler.exec = async (sock,m)=>{
 let jid=m.key.remoteJid, who=m.key.participant||m.participant||m.key.remoteJid
 if(!isRegistered(who)) return sock.sendMessage(jid,{text:'✳️ .reg primero'},{quoted:m})
 let cd=canUse(who,'boss',15*60*1000); if(!cd.ok) return sock.sendMessage(jid,{text:`🐉 BOSS cooldown: ${formatTime(cd.left)}`},{quoted:m})
 let e=ensureDB(who); let power=e.fuerza+Math.floor(Math.random()*20); let bossPower=Math.floor(Math.random()*80)+20
 if(power>=bossPower){ let win=Math.floor(Math.random()*3000)+1000; addMoney(who,win); await sock.sendMessage(jid,{text:comicBox(`🐉 VENCISTE AL BOSS\n\n⚔️ Tu poder: ${power} vs ${bossPower}\n💰 +$${win}`)},{quoted:m}) } else { await sock.sendMessage(jid,{text:comicBox(`💀 EL BOSS TE APLASTÓ\n\n⚔️ Tu poder: ${power} vs ${bossPower}\nEntrena con .entrenar`)},{quoted:m}) }
 setCooldown(who,'boss'); global.saveDB?.()
}
