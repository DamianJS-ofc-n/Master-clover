import { ensureDB, comicBox, isRegistered } from '../../core/economy.js'
export const handler = {}; handler.name='slots'; handler.category='Economy'
handler.exec = async (sock,m,args)=>{
 let jid=m.key.remoteJid, who=m.key.participant||m.participant||m.key.remoteJid
 if(!isRegistered(who)) return sock.sendMessage(jid,{text:'✳️ .reg primero'},{quoted:m})
 let bet=parseInt(args[0])||100; let e=ensureDB(who); if(e.money<bet) return sock.sendMessage(jid,{text:'❌ Sin plata'},{quoted:m})
 let emojis=['🍒','🍋','💎','7️⃣','🍃']; let a=emojis[Math.floor(Math.random()*emojis.length)], b=emojis[Math.floor(Math.random()*emojis.length)], c=emojis[Math.floor(Math.random()*emojis.length)]
 let win=a===b&&b===c; if(win){ let prize=bet*3; e.money+=prize; await sock.sendMessage(jid,{text:comicBox(`🎰 SLOTS\n\n[ ${a} | ${b} | ${c} ]\n\n🌠 JACKPOT! +$${prize}`)},{quoted:m}) } else { e.money-=bet; await sock.sendMessage(jid,{text:comicBox(`🎰 SLOTS\n\n[ ${a} | ${b} | ${c} ]\n\n💀 Perdiste $${bet}`)},{quoted:m}) }
 global.saveDB?.()
}
