import { ensureDB, canUse, setCooldown, formatTime, comicBox, isRegistered, COIN, formatMoney } from '../../core/economy.js'
export const handler = {}; handler.name='retirar'; handler.alias=['ret','withdraw','sacar']; handler.category='Economy'
handler.exec = async (sock, m, args) => {
 let jid=m.key.remoteJid, who=m.key.participant||m.participant||m.key.remoteJid
 if(!isRegistered(who)) return sock.sendMessage(jid,{text:'✳️ .reg primero'},{quoted:m})
 let e=ensureDB(who); let raw=(args[0]||'').toLowerCase(); let amount=raw==='todo'||raw==='all'?e.bank:parseInt(raw)
 if(!amount||amount<=0) return sock.sendMessage(jid,{text:comicBox(`🏦 ${e.name}, ¿cuánto quieres retirar?\n.retirar 100\n.retirar todo`)},{quoted:m})
 let cd=canUse(who,'banco_retirar',60*60*1000); if(!cd.ok) return sock.sendMessage(jid,{text:`⏳ ${e.name}, solo puedes retirar cada 1h, te faltan ${formatTime(cd.left)}`},{quoted:m})
 if(e.bank<amount) return sock.sendMessage(jid,{text:`❌ ${e.name}, en el banco solo tienes ${formatMoney(e.bank)}`},{quoted:m})
 e.bank-=amount; e.money+=amount; setCooldown(who,'banco_retirar'); global.saveDB?.()
 await sock.sendMessage(jid,{text:comicBox(`🏦 ${e.name} retiró ${formatMoney(amount)} ${COIN} del banco\n💵 Cartera: ${formatMoney(e.money)}\n🏦 Banco: ${formatMoney(e.bank)}`)},{quoted:m})
}
