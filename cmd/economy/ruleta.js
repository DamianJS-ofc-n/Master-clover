import { ensureDB, comicBox, isRegistered } from '../../core/economy.js'
export const handler = {}; handler.name='ruleta'; handler.category='Economy'
handler.exec = async (sock,m,args)=>{
 let jid=m.key.remoteJid, who=m.key.participant||m.participant||m.key.remoteJid
 if(!isRegistered(who)) return sock.sendMessage(jid,{text:'✳️ .reg primero'},{quoted:m})
 let color=(args[0]||'').toLowerCase(), bet=parseInt(args[1])
 if(!['rojo','negro'].includes(color)||!bet) return sock.sendMessage(jid,{text:'🎰 .ruleta rojo 100 | .ruleta negro 100\n50/50'},{quoted:m})
 let e=ensureDB(who); if(e.money<bet) return sock.sendMessage(jid,{text:'❌ Sin plata'},{quoted:m})
 let result=Math.random()<0.5?'rojo':'negro'; let win=result===color
 if(win) e.money+=bet; else e.money-=bet; global.saveDB?.()
 await sock.sendMessage(jid,{text:comicBox(`🎰 RULETA\n\n🎯 Apostaste: ${color} $${bet}\n🌀 Salió: ${result}\n${win?'🎉 GANASTE +$'+bet:'💀 PERDISTE -$'+bet}\n💰 Total: $${e.money}`)},{quoted:m})
}
