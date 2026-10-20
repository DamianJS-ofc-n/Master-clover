export const handler = {}
handler.name = 'encuesta'
handler.alias = ['poll','vote']
handler.category = 'general'
handler.description = 'Crear encuesta'
handler.exec = async (sock, m) => {
  const from = m.key.remoteJid
  const body = m.message?.conversation || m.message?.extendedTextMessage?.text || ''
  const texto = body.split(/ +/).slice(1).join(' ')
  //.encuesta Te gusta kitsune? | Si | No | Maso
  const parts = texto.split('|').map(s=>s.trim()).filter(Boolean)
  if(parts.length < 3) return await sock.sendMessage(from,{text:'> ✧ Usa:.encuesta ¿Pregunta? | Si | No'},{quoted:m})
  const pregunta = parts[0]
  const opciones = parts.slice(1)
  let txt = `📊 *ENCUESTA*\n\n*${pregunta}*\n\n`
  opciones.forEach((o,i)=> txt+=`${i+1}. ${o}\n`)
  txt+=`\n> Responde con el número de tu voto`
  await sock.sendMessage(from,{text:txt},{quoted:m})
}
