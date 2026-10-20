export const handler = {}
handler.name = 'culpable'
handler.category = 'fun'
handler.description = 'Vota culpable en el juicio'

handler.exec = async (sock, m) => {
  const chatId = m.key.remoteJid
  if(!global.juicios) global.juicios = new Map()
  const data = global.juicios.get(chatId)
  if(!data) return sock.sendMessage(chatId,{text:"❌ No hay juicio activo"}, {quoted:m})
  const voter = m.key.participant || m.key.remoteJid
  if(data.votantes.has(voter)) return sock.sendMessage(chatId,{text:"❌ Ya votaste"}, {quoted:m})
  data.votantes.add(voter); data.culpable++
  await sock.sendMessage(chatId,{text:`🔨 Voto CULPABLE\n🔨 ${data.culpable} vs 🙏 ${data.inocente}`, mentions:[voter]})
}