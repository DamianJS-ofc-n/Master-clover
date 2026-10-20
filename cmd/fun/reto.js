export const handler = {}
handler.name = 'reto'
handler.category = 'fun'
handler.description = 'Reto random'
const list = ["Manda un audio cantando","Cambia tu foto de perfil por 10 min","Di que estás enamorado en el grupo","Escribe 1 min solo con el teclado al revés","Manda tu última foto de galería"]
handler.exec = async (sock, m) => {
  const from = m.key.remoteJid
  const r = list[Math.floor(Math.random()*list.length)]
  await sock.sendMessage(from,{text:`😈 *RETO*\n\n> ${r}`},{quoted:m})
}
