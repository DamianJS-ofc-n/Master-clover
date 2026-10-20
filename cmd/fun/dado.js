export const handler = {}
handler.name = 'dado'
handler.alias = ['dice']
handler.category = 'utiles'
handler.description = 'Tirar un dado 1-6'
handler.exec = async (sock, m) => {
  const n = Math.floor(Math.random()*6)+1
  await sock.sendMessage(m.key.remoteJid,{text:`> [ DADO ]\n> Salio: ${n}`},{quoted:m})
}
