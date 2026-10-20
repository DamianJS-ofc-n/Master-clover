export const handler = {}
handler.name = 'contar'
handler.alias = ['count']
handler.category = 'utiles'
handler.description = 'Cuenta letras de un texto'
handler.exec = async (sock, m, args) => {
  const txt = args.join(' ')
  if(!txt) return await sock.sendMessage(m.key.remoteJid,{text:'> Usa: .contar hola'},{quoted:m})
  await sock.sendMessage(m.key.remoteJid,{text:`> [ CONTAR ]\n> Letras: ${txt.length}\n> Palabras: ${txt.split(' ').length}\n> Sin espacios: ${txt.replace(/ /g,'').length}`},{quoted:m})
}
