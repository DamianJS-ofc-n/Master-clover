export const handler = {}
handler.name = '8ball'
handler.alias = ['8b','pregunta','suerte']
handler.category = 'fun'
handler.description = 'Bola 8 magica'

const resp = [
  "Sí, definitivamente 💯", "Es cierto", "Sin duda", "Sí",
  "Puedes confiar en ello", "Como yo lo veo, sí", "Lo más probable",
  "Perspectiva buena", "Sí, totalmente", "Las señales dicen que sí",
  "Respuesta confusa, vuelve a intentar", "Pregunta de nuevo más tarde",
  "Mejor no decirte ahora", "No se puede predecir ahora",
  "Concéntrate y pregunta de nuevo", "No cuentes con ello",
  "Mi respuesta es no", "Mis fuentes dicen que no", "Muy dudoso", "No"
]

handler.exec = async (sock, m) => {
  const from = m.key.remoteJid
  const body = m.message?.conversation || m.message?.extendedTextMessage?.text || ''
  const pregunta = body.split(/ +/).slice(1).join(' ')
  if(!pregunta) return sock.sendMessage(from,{text:'> ✧ Hazme una pregunta\nEj:.8ball me quiere?'},{quoted:m})
  const r = resp[Math.floor(Math.random()*resp.length)]
  await sock.sendMessage(from,{text:`🎱 *8BALL*\n\n❓ Pregunta: ${pregunta}\n\n> 🎯 Respuesta: *${r}*`},{quoted:m})
}
