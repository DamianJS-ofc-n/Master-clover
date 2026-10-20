export const handler = {}
handler.name = 'hora'
handler.alias = ['horario','fecha']
handler.category = 'utiles'
handler.description = 'Ver fecha y hora actual'
handler.exec = async (sock, m) => {
  const now = new Date()
  await sock.sendMessage(m.key.remoteJid,{text:`> :: HORA ::\n> Fecha: ${now.toLocaleDateString()}\n> Hora: ${now.toLocaleTimeString()}`},{quoted:m})
}
