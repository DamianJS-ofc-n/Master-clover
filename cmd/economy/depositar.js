import { ensureDB, comicBox, isRegistered, COIN, formatMoney } from '../../core/economy.js'
export const handler = {}; handler.name='depositar'; handler.alias=['dep','deposit','guardar']; handler.category='Economy'
handler.exec = async (sock, m, args) => {
 let jid=m.key.remoteJid, who=m.key.participant||m.participant||m.key.remoteJid
 if(!isRegistered(who)) return sock.sendMessage(jid,{text:'✳️ .reg primero'},{quoted:m})
 let e=ensureDB(who); let raw=(args[0]||'').toLowerCase(); let amount=raw==='todo'||raw==='all'?e.money:parseInt(raw)
 if(!amount||amount<=0) return sock.sendMessage(jid,{text:comicBox(`🏦 ${e.name}, ¿cuánto quieres depositar?\n.depositar 100\n.depositar todo\n\nCartera: ${formatMoney(e.money)}`)},{quoted:m})
 if(e.money<amount) return sock.sendMessage(jid,{text:`❌ ${e.name}, solo tienes ${formatMoney(e.money)}`},{quoted:m})
 e.money-=amount; e.bank+=amount; global.saveDB?.()
 await sock.sendMessage(jid,{text:comicBox(`🏦 ${e.name} depositó ${formatMoney(amount)} ${COIN} en el banco\n💵 Cartera: ${formatMoney(e.money)}\n🏦 Banco: ${formatMoney(e.bank)}`)},{quoted:m})
}
