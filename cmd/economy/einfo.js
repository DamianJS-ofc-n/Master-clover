import { ensureDB, formatTime, comicBox, isRegistered } from '../../core/economy.js'
export const handler = {}
handler.name = 'einfo'
handler.category = 'Economy'
handler.exec = async (sock, m) => {
 let jid = m.key.remoteJid, who = m.key.participant || m.participant || m.key.remoteJid
 if (!isRegistered(who)) return sock.sendMessage(jid, { text: '✳️ .reg primero' }, { quoted: m })
 let e = ensureDB(who)
 let now = Date.now()
 let lines = []
 for (let [k,v] of Object.entries(e.cooldowns)) {
 let diff = v + (k==='daily'?86400000:k==='bankWithdraw'?3600000:180000) - now
 if (diff > 0) lines.push(`⏱️ ${k}: ${formatTime(diff)}`)
 else lines.push(`✅ ${k}: listo`)
 }
 if (!lines.length) lines.push('✅ Todo listo')
 await sock.sendMessage(jid, { text: comicBox(`🌀 COOLDOWNS DE ${e.name}\n\n${lines.join('\n')}`) }, { quoted: m })
}
