export const handler = {}
handler.name = 'verdad'
handler.category = 'fun'
handler.description = 'Verdad random'
const list = ["¿Cuál fue tu última mentira?","¿A quién stalkeas más?","¿Te gusta alguien del grupo?","¿Alguna vez te han rechazado feo?","¿Cuál es tu secreto más oscuro?","¿Con quién del grupo te besarías?"]
handler.exec = async (sock, m) => {
  const from = m.key.remoteJid
  const r = list[Math.floor(Math.random()*list.length)]
  await sock.sendMessage(from,{text:`😳 *VERDAD*\n\n> ${r}`},{quoted:m})
}
