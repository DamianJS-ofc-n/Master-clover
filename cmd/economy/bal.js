import { ensureDB, getRango, comicBox, isRegistered, COIN, formatMoney } from '../../core/economy.js'
export const handler = {}; handler.name='bal'; handler.alias=['balance','cartera']; handler.category='Economy'
handler.exec = async (sock, m) => {
 let jid=m.key.remoteJid, who=m.key.participant||m.participant||m.key.remoteJid
 if(!isRegistered(who)) return sock.sendMessage(jid,{text:'✳️ .reg Nombre/Edad primero'},{quoted:m})
 let e=ensureDB(who)
 await sock.sendMessage(jid,{text:comicBox(`👤 ${e.name} | Lv${e.level} ${getRango(e.level)}\n\n💵 Cartera: ${formatMoney(e.money)} ${COIN}\n🏦 Banco: ${formatMoney(e.bank)}\n📦 Total: ${formatMoney(e.money+e.bank)}\n\n🌲${e.inv.madera} 🪨${e.inv.piedra} 🐟${e.inv.pez} | 🐔${e.gallinas} 🥚${e.inv.huevo}`)},{quoted:m})
}
