import { ensureDB, formatTime, comicBox, isRegistered, canUse, setCooldown } from '../../core/economy.js'
export const handler = {}
handler.name = 'banco'
handler.alias = ['bank']
handler.category = 'Economy'
handler.exec = async (sock, m, args) => {
 let jid = m.key.remoteJid, who = m.key.participant || m.participant || m.key.remoteJid
 if (!isRegistered(who)) return sock.sendMessage(jid, { text: '✳️ .reg primero' }, { quoted: m })
 let e = ensureDB(who)
 let type = (args[0]||'').toLowerCase(), amount = parseInt(args[1])
 if (!type) return sock.sendMessage(jid, { text: comicBox(`🏦 BANCO\n\n.banco guardar 500\n.banco sacar 500\n\nCartera: $${e.money}\nBanco: $${e.bank}\nSacar solo cada 1h`) }, { quoted: m })
 if (type === 'guardar' || type === 'depositar') {
 if (!amount || amount > e.money) return sock.sendMessage(jid, { text: `❌ No tienes $${amount}` }, { quoted: m })
 e.money -= amount; e.bank += amount; global.saveDB?.()
 await sock.sendMessage(jid, { text: `🏦 Guardaste $${amount} en banco` }, { quoted: m })
 } else if (type === 'sacar' || type === 'retirar') {
 let cd = canUse(who, 'bankWithdraw', 60*60*1000)
 if (!cd.ok) return sock.sendMessage(jid, { text: `⏳ Banco bloqueado: ${formatTime(cd.left)}` }, { quoted: m })
 if (!amount || amount > e.bank) return sock.sendMessage(jid, { text: `❌ Solo tienes $${e.bank} en banco` }, { quoted: m })
 e.bank -= amount; e.money += amount; setCooldown(who, 'bankWithdraw'); global.saveDB?.()
 await sock.sendMessage(jid, { text: `🏦 Sacaste $${amount}` }, { quoted: m })
 }
}
