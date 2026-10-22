import { isOwnerCheck } from '../../lib/isOwner.js'
export const handler = {}

handler.name = 'restart'
handler.alias = ['reiniciar', 'reboot']
handler.category = 'owner'
handler.description = 'Reinicia el bot'
handler.owner = true

if (!global.restartCooldown) global.restartCooldown = new Map()

handler.exec = async (sock, m, args) => {
 // === OWNER CHECK INDEPENDIENTE DE MAIN ===
 let senderRaw = m.key?.participant || m.key?.remoteJid || ''
 let senderClean = senderRaw.split('@')[0].split(':')[0].replace(/\D/g,'')
 // intenta resolver si viene args extra
 let senderResolved = args?.__senderResolved || senderClean
 if(!isOwnerCheck(senderRaw, senderResolved, senderClean) && !m.key?.fromMe) return

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