import { ensureDB, comicBox, isRegistered } from '../../core/economy.js'
export const handler = {}; handler.name='vender'; handler.category='Economy'
handler.exec = async (sock,m,args)=>{
 let jid=m.key.remoteJid, who=m.key.participant||m.participant||m.key.remoteJid
 if(!isRegistered(who)) return sock.sendMessage(jid,{text:'✳️ .reg primero'},{quoted:m})
 if((args[0]||'').toLowerCase()!=='todo') return sock.sendMessage(jid,{text:'🛒 .vender todo'},{quoted:m})
 let e=ensureDB(who)
 let total= e.inv.madera*10 + e.inv.piedra*15 + e.inv.pez*20 + e.inv.carne*25 + e.inv.mineral*100 + e.inv.hierro*50
 e.inv={madera:0,piedra:0,pez:0,carne:0,mineral:0,huevo:e.inv.huevo,hierro:0}
 e.money+=total; global.saveDB?.()
 await sock.sendMessage(jid,{text:comicBox(`🛒 VENDISTE TODO\n\n💰 +$${total}\n💰 Total: $${e.money}`)},{quoted:m})
}
