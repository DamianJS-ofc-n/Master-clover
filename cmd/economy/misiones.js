import { ensureDB, addMoney, comicBox, isRegistered } from '../../core/economy.js'
export const handler = {}; handler.name='misiones'; handler.alias=['mision']; handler.category='Economy'
handler.exec = async (sock,m)=>{
 let jid=m.key.remoteJid, who=m.key.participant||m.participant||m.key.remoteJid
 if(!isRegistered(who)) return sock.sendMessage(jid,{text:'✳️ .reg primero'},{quoted:m})
 let e=ensureDB(who)
 if(e.misiones.pesca>=5 && e.misiones.mina>=3){
 addMoney(who,2000); e.misiones.pesca=0; e.misiones.mina=0; global.saveDB?.()
 return sock.sendMessage(jid,{text:comicBox(`🎉 MISIÓN COMPLETADA\n\nPesca 5 + Mina 3\n💰 +$2000`)},{quoted:m})
 }
 await sock.sendMessage(jid,{text:comicBox(`🌀 MISIONES\n\n🎣 Pesca 5 veces: ${e.misiones.pesca}/5\n⛏️ Mina 3 veces: ${e.misiones.mina}/3\n💰 Recompensa: $2000\n\nUsa .pescar y .minar`)},{quoted:m})
}
