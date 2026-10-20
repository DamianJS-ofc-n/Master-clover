export const handler = {}
handler.name = 'clima'
handler.alias = ['weather']
handler.category = 'general'
handler.description = 'Ver clima'
handler.exec = async (sock, m) => {
  const from = m.key.remoteJid
  const body = m.message?.conversation || m.message?.extendedTextMessage?.text || ''
  const city = body.split(/ +/).slice(1).join(' ')
  if(!city) return await sock.sendMessage(from,{text:'> ✧ Ej:.clima Lima'},{quoted:m})
  try{
    const res = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=%C+%t+%w+%h`)
    const t = await res.text()
    await sock.sendMessage(from,{text:`☁️ *CLIMA ${city.toUpperCase()}*\n> ${t}`},{quoted:m})
  }catch{
    await sock.sendMessage(from,{text:'> ✧ Error obteniendo clima'},{quoted:m})
  }
}
