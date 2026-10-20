export const handler = {}
handler.name = 'reverse'
handler.alias = ['alreves']
handler.category = 'utiles'
handler.description = 'Texto al reves'
handler.exec = async (sock, m, args) => {
  const txt = args.join(' ')
  if(!txt) return
  await sock.sendMessage(m.key.remoteJid,{text:`> [ REVERSE ]\n> ${txt.split('').reverse().join('')}`},{quoted:m})
}
