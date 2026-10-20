export const handler = {}
handler.name = 'otaku'
handler.category = 'fun'
handler.description = 'Cuanto otaku eres'
handler.exec = async (sock, m) => {
  const from = m.key.remoteJid
  const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
  const target = mentioned[0] || m.key.participant || from
  const porc = Math.floor(Math.random()*101)
  const barra = '█'.repeat(Math.floor(porc/10)) + '░'.repeat(10 - Math.floor(porc/10))
  await sock.sendMessage(from,{text:`╭─ *OTAKU 🍙* ─\n│ @${target.split('@')[0]} es *${porc}%* otaku\n│ [${barra}] ${porc}%\n╰───────`, mentions:[target]},{quoted:m})
}
