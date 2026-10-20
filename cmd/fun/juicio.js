export const handler = {}
handler.name = 'juicio'
handler.alias = ['tribunal','juzgar']
handler.category = 'fun'
handler.description = 'Pone a alguien en juicio grupal'

handler.exec = async (sock, m, a) => {
  const chatId = m.key.remoteJid
  if(!chatId.endsWith('@g.us')) return sock.sendMessage(chatId,{text:"Solo grupos"}, {quoted:m})
  if(!global.juicios) global.juicios = new Map()
  if(global.juicios.has(chatId)) return sock.sendMessage(chatId,{text:"⚖️ Ya hay juicio. Usen.culpable o.inocente"}, {quoted:m})
  const mention = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
  if(!mention) return sock.sendMessage(chatId,{text:"✳️ Usa:.juicio @usuario [motivo]"}, {quoted:m})
  const motivo = a.join(" ").replace(/@\d+/g,"").trim() || "sospechoso"
  global.juicios.set(chatId, {acusado:mention, motivo, culpable:0, inocente:0, votantes:new Set()})
  await sock.sendMessage(chatId,{text:`⚖️ *TRIBUNAL* ⚖️\n\nAcusado: @${mention.split('@')[0]}\nCargo: ${motivo}\n\n🔨.culpable = CULPABLE\n🙏.inocente = INOCENTE\n60 seg`, mentions:[mention]})
  setTimeout(async ()=>{
    const data = global.juicios.get(chatId); if(!data) return
    global.juicios.delete(chatId)
    const total = data.culpable + data.inocente
    if(total===0) return sock.sendMessage(chatId,{text:`⚖️ Nadie votó, @${data.acusado.split('@')[0]} libre`, mentions:[data.acusado]})
    await sock.sendMessage(chatId,{text:`⚖️ *VEREDICTO*\n\n@${data.acusado.split('@')[0]}\n🔨 Culpable: ${data.culpable}\n🙏 Inocente: ${data.inocente}\n\n${data.culpable>data.inocente?'🔴 CULPABLE':'🟢 INOCENTE'}`, mentions:[data.acusado]})
  }, 60000)
}