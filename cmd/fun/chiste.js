export const handler = {}
handler.name = 'chiste'
handler.category = 'fun'
handler.description = 'Chiste random'
const chistes = ["¿Qué hace una abeja en el gym? ¡Zum-ba!","¿Por qué los esqueletos no pelean? No tienen agallas","-¿Me das un café? -Se me ha acabado el café, solo me queda té. -Pues té. -¿Qué té? -El teléfono que no funciona"]
handler.exec = async (sock, m) => {
  const from = m.key.remoteJid
  const r = chistes[Math.floor(Math.random()*chistes.length)]
  await sock.sendMessage(from,{text:`😂 *CHISTE*\n\n> ${r}`},{quoted:m})
}
