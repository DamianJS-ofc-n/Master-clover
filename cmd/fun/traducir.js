export const handler = {}
handler.name = 'traducir'
handler.alias = ['tr','translate']
handler.category = 'general'
handler.description = 'Traductor'
handler.exec = async (sock, m) => {
  const from = m.key.remoteJid
  const body = m.message?.conversation || m.message?.extendedTextMessage?.text || ''
  const args = body.split(/ +/)
  if(args.length < 3) return await sock.sendMessage(from,{text:'> ✧ Ej:.traducir en hola como estas?'},{quoted:m})
  const lang = args[1]
  const q = args.slice(2).join(' ')
  try{
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=es|${lang}`)
    const j = await res.json()
    await sock.sendMessage(from,{text:`🌐 *ES -> ${lang.toUpperCase()}*\n\n> ${j.responseData.translatedText}`},{quoted:m})
  }catch{
    await sock.sendMessage(from,{text:'> ✧ Error traduciendo'},{quoted:m})
  }
}
