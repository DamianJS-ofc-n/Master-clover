import config from '../../config.js'
export const handler = {}

handler.name = 'restart'
handler.alias = ['reiniciar', 'reboot']
handler.category = 'owner'
handler.description = 'Reinicia el bot'
handler.owner = true

if (!global.restartCooldown) global.restartCooldown = new Map()

function getOwnersFromConfig() {
 let list = config?.bot?.owner || []
 return list.map(n => n.toString().split('@')[0].replace(/\D/g,'')).filter(Boolean)
}

function isOwnerDirect(m) {
 let raw = m.key?.participant || m.key?.remoteJid || ''
 let clean = raw.split('@')[0].split(':')[0].replace(/\D/g,'')
 if (m.key?.fromMe) return true
 let owners = getOwnersFromConfig()
 return owners.includes(clean) || config.bot.owner.includes(raw)
}

handler.exec = async (sock, m, args) => {
 if (!isOwnerDirect(m)) {
 return await sock.sendMessage(m.key.remoteJid, { text: '⚠️ Solo owners pueden usar esto.' }, { quoted: m })
 }

 const jid = m.key.remoteJid
 const sender = m.key.participant || jid
 const now = Date.now()
 const COOLDOWN = 5 * 60 * 1000 // 5 minutos

 const last = global.restartCooldown.get(sender) || 0
 const diff = now - last

 if (diff < COOLDOWN) {
 const rest = COOLDOWN - diff
 const min = Math.floor(rest / 60000)
 const sec = Math.floor((rest % 60000) / 1000)
 return await sock.sendMessage(jid, { 
 text: `⏳ *Cooldown activo*\n\nEspera *${min}m ${sec}s* para volver a reiniciar.\n\n> Para no matar el bot.` 
 }, { quoted: m })
 }

 global.restartCooldown.set(sender, now)

 await sock.sendMessage(jid, { text: '✎ Reiniciando el Socket...\n> *Espere un momento...*' }, { quoted: m })

 setTimeout(() => {
 if (process.send) {
 process.send('restart')
 } else {
 process.exit(0)
 }
 }, 3000)
}

export default handler
