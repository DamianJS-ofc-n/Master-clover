import { ensureDB, getRango, comicBox, isRegistered } from '../../core/economy.js'
export const handler = {}; handler.name='nivel'; handler.alias=['lvl','level']; handler.category='Economy'
handler.exec = async (sock,m)=>{
 let jid=m.key.remoteJid, who=m.key.participant||m.participant||m.key.remoteJid
 if(!isRegistered(who)) return sock.sendMessage(jid,{text:'✳️ .reg primero'},{quoted:m})
 let e=ensureDB(who)
 let txt=`🌠 NIVEL DE ${e.name}\n\n${getRango(e.level)}\nLevel: ${e.level}\nEXP: ${e.exp}/1000\n\nSiguiente rango: revisa .topnivel\n💡 Gana $ para subir`
 await sock.sendMessage(jid,{text:comicBox(txt)},{quoted:m})
}
