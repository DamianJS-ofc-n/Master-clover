export const handler = {}
handler.name = 'piropo'
handler.category = 'fun'
handler.description = 'Piropo random'
const list = ["Eres como Google, todo lo que busco lo encuentro en ti","Si fueras un triangulo serias acutangulo, porque eres muy agudo","¿Tienes un mapa? Me perdí en tus ojos"]
handler.exec = async (sock, m) => {
  const from = m.key.remoteJid
  const r = list[Math.floor(Math.random()*list.length)]
  await sock.sendMessage(from,{text:`😏 *PIROPO*\n\n> ${r}`},{quoted:m})
}
