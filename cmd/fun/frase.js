export const handler = {}
handler.name = 'frase'
handler.alias = ['frases']
handler.category = 'fun'
handler.description = 'Frase motivadora'
const list = ["La vida es corta, sonrie mientras tengas dientes","Si te caes 7 veces, levantate 8","No cuentes los días, haz que los días cuenten","El éxito es la suma de pequeños esfuerzos","No busques, encuentra"]
handler.exec = async (sock, m) => {
  const from = m.key.remoteJid
  const r = list[Math.floor(Math.random()*list.length)]
  await sock.sendMessage(from,{text:`✨ *FRASE*\n\n> "${r}"`},{quoted:m})
}
