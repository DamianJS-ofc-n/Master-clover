export const handler = {}
handler.name = 'doxeo'
handler.alias = ['dox','doxxeo']
handler.category = 'fun'
handler.description = 'Doxeo fake'
handler.exec = async (sock, m) => {
  const from = m.key.remoteJid
  const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
  const target = mentioned || m.key.participant || from
  const ip = `${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`
  await sock.sendMessage(from,{text:`*DOXEO FAKE 😂*\n\n> Usuario: @${target.split('@')[0]}\n> IP: ${ip}\n> Pais: Peru\n> Ciudad: Lima\n> Coords: -12.04, -77.02\n\n> _esto es broma, no es real_`, mentions:[target]},{quoted:m})
}
