import { ensureDB, canUse, setCooldown, addMoney, formatTime, comicBox, isRegistered } from '../../core/economy.js'
export const handler = {}
handler.name = 'talar'
handler.alias = ['madera']
handler.category = 'Economy'
handler.exec = async (sock, m) => {
 let jid = m.key.remoteJid, who = m.key.participant || m.participant || m.key.remoteJid
 if (!isRegistered(who)) return sock.sendMessage(jid, { text: '✳️ .reg primero' }, { quoted: m })
 let cd = canUse(who, 'talar', 2*60*1000)
 if (!cd.ok) return sock.sendMessage(jid, { text: `🪓 Hacha en cooldown: ${formatTime(cd.left)}` }, { quoted: m })
 let e = ensureDB(who); let madera = Math.floor(Math.random()*5)+2
 e.inv.madera += madera; let cash = Math.floor(Math.random()*150)+30
 addMoney(who, cash); setCooldown(who, 'talar'); global.saveDB?.()
 await sock.sendMessage(jid, { text: comicBox(`🪓 TALANDO...\n\n🌲 Madera: +${madera}\n💰 $${cash}`) }, { quoted: m })
}
