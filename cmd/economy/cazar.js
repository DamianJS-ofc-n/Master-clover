import { ensureDB, canUse, setCooldown, addMoney, formatTime, comicBox, isRegistered } from '../../core/economy.js'
export const handler = {}; handler.name='cazar'; handler.category='Economy'
handler.exec = async (sock,m)=>{
 let jid=m.key.remoteJid, who=m.key.participant||m.participant||m.key.remoteJid
 if(!isRegistered(who)) return sock.sendMessage(jid,{text:'✳️ .reg primero'},{quoted:m})
 let cd=canUse(who,'cazar',3*60*1000); if(!cd.ok) return sock.sendMessage(jid,{text:`🏹 Cooldown: ${formatTime(cd.left)}`},{quoted:m})
 let e=ensureDB(who); let carne=Math.floor(Math.random()*3)+1; e.inv.carne+=carne; let cash=Math.floor(Math.random()*250)+50
 addMoney(who,cash); setCooldown(who,'cazar'); global.saveDB?.()
 await sock.sendMessage(jid,{text:comicBox(`🏹 CAZANDO...\n\n🥩 Carne: +${carne}\n💰 $${cash}`)},{quoted:m})
}
