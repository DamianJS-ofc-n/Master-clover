export const handler = {}
handler.name = 'moneda'
handler.alias = ['coin','cara']
handler.category = 'utiles'
handler.description = 'Tira una moneda cara o cruz'
handler.exec = async (sock, m) => {
  const r = Math.random() > 0.5 ? 'Cara' : 'Cruz'
  await sock.sendMessage(m.key.remoteJid,{text:`> [ MONEDA ]\n> Salio: ${r}`},{quoted:m})
}
