export const handler = {}
handler.name = 'afk'
handler.alias = 'af'
handler.category = 'fun'
handler.exec = async (sock, m, args) => {
  const jid = m.key.remoteJid
  const sender = (m.key.participant || jid).replace(/[^0-9]/g,'')
  const reason = args.join(' ') || 'Sin razón'
  global.afkUsers.set(sender, { reason, time: Date.now() })
  await sock.sendMessage(jid, { text: `《✧》 @${sender} ahora está AFK\n> Razón: ${reason}`, mentions: [sender+'@s.whatsapp.net'] }, { quoted: m })
}
