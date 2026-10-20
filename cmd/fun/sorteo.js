export const handler = {}
handler.name = 'sorteo'
handler.alias = ['giveaway','rifa']
handler.category = 'fun'
handler.description = 'Sorteo random del grupo'
handler.exec = async (sock, m) => {
  const from = m.key.remoteJid
  if(!from.endsWith('@g.us')) return
  const meta = await sock.groupMetadata(from)
  const parts = meta.participants.map(p=>p.id)
  const ganador = parts[Math.floor(Math.random()*parts.length)]
  await sock.sendMessage(from,{text:`⚔️ *SORTEO*\n\n> El ganador es: @${ganador.split('@')[0]} 🏆`, mentions:[ganador]},{quoted:m})
}
