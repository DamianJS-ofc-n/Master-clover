export const handler = {}
handler.name = 'calc'
handler.alias = ['calcular','calculo']
handler.category = 'general'
handler.description = 'Calculadora'
handler.exec = async (sock, m) => {
  const from = m.key.remoteJid
  const body = m.message?.conversation || m.message?.extendedTextMessage?.text || ''
  const texto = body.split(/ +/).slice(1).join(' ')
  if(!texto) return await sock.sendMessage(from,{text:'> ✧ Ej:.calc 50*2+10'},{quoted:m})
  try{
    const safe = texto.replace(/[^0-9+\-*/().% ]/g,'')
    // eslint-disable-next-line no-eval
    const res = eval(safe)
    await sock.sendMessage(from,{text:`🧮 *${texto}* = *${res}*`},{quoted:m})
  }catch{
    await sock.sendMessage(from,{text:'> ✧ Operación invalida'},{quoted:m})
  }
}
