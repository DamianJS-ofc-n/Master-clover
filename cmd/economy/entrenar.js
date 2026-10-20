import { ensureDB, canUse, setCooldown, formatTime, comicBox, isRegistered } from '../../core/economy.js'
export const handler = {}; handler.name='entrenar'; handler.category='Economy'
handler.exec = async (sock,m)=>{
 let jid=m.key.remoteJid, who=m.key.participant||m.participant||m.key.remoteJid
 if(!isRegistered(who)) return sock.sendMessage(jid,{text:'✳️ .reg primero'},{quoted:m})
 let cd=canUse(who,'entrenar',5*60*1000); if(!cd.ok) return sock.sendMessage(jid,{text:`💪 Cooldown: ${formatTime(cd.left)}`},{quoted:m})
 let e=ensureDB(who); e.fuerza+=3; e.defensa+=1; setCooldown(who,'entrenar'); global.saveDB?.()
 await sock.sendMessage(jid,{text:comicBox(`💪 ENTRENAMIENTO\n\n⚡ Fuerza +3 = ${e.fuerza}\n🫯 Defensa +1 = ${e.defensa}`)},{quoted:m})
}
