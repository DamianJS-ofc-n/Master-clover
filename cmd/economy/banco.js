import { ensureDB, comicBox, isRegistered, COIN, formatMoney } from '../../core/economy.js'
export const handler = {}; handler.name='banco'; handler.alias=['bank']; handler.category='Economy'
handler.exec = async (sock, m) => {
 let jid=m.key.remoteJid, who=m.key.participant||m.participant||m.key.remoteJid
 if(!isRegistered(who)) return sock.sendMessage(jid,{text:'✳️ .reg primero'},{quoted:m})
 let e=ensureDB(who)
 await sock.sendMessage(jid,{text:comicBox(`🏦 Banco de ${e.name}\n\n💵 Cartera: ${formatMoney(e.money)} ${COIN}\n🏦 Guardado: ${formatMoney(e.bank)} ${COIN}\n📦 Total: ${formatMoney(e.money+e.bank)}\n\nUsa .depositar / .retirar`)},{quoted:m})
}
