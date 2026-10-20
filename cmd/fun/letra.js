global.partidasAhorcado = global.partidasAhorcado || {}
const stages = [" \n\n\n "," \n\n |\n |\n |\n "," ______\n |\n |\n |\n "," ______\n | O\n |\n |\n "," ______\n | O\n | |\n |\n "," ______\n | O\n | /|\n |\n "," ______\n | O\n | /|\\\n |\n "," ______\n | O\n | /|\\\n | /\n "," ______\n | O\n | /|\\\n | / \\\n "]
function ocultar(p,l){return p.split('').map(x=>l.includes(x)?x:'_').join(' ')}

export const handler = {}
handler.name = 'letra'
handler.alias = ['letra']
handler.category = 'fun'
handler.description = 'Adivina letra del ahorcado'

handler.exec = async (sock, m) => {
  const from = m.key.remoteJid
  const body = m.message?.conversation || m.message?.extendedTextMessage?.text || ''
  const letra = body.split(/ +/).slice(1).join(' ').toLowerCase()[0]
  if(!global.partidasAhorcado[from]) return sock.sendMessage(from,{text:'> ⚠️ No hay partida. Usa *.ahorcado*'}, {quoted:m})
  if(!letra) return sock.sendMessage(from,{text:'> 🔤 Pon una letra\nEj: *.letra k*'}, {quoted:m})
  let partida = global.partidasAhorcado[from]
  if(partida.letras.includes(letra)) return sock.sendMessage(from,{text:`> ⚠️ Ya usaste "${letra}"`},{quoted:m})
  partida.letras.push(letra)
  if(partida.palabra.includes(letra)){
    let oculto = ocultar(partida.palabra, partida.letras)
    if(!oculto.includes('_')){
      await sock.sendMessage(from,{text:`🎉 ¡Ganaste ${partida.jugador}! Era *${partida.palabra}* 🦊`},{quoted:m})
      delete global.partidasAhorcado[from]
    } else {
      await sock.sendMessage(from,{text:`✅ Bien! ${oculto}\nUsadas: ${partida.letras.join(', ')}`},{quoted:m})
    }
  } else {
    partida.errores++
    if(partida.errores >= stages.length - 1){
      await sock.sendMessage(from,{text:`${stages[partida.errores]}\n\n❌ Perdiste, era *${partida.palabra}*`},{quoted:m})
      delete global.partidasAhorcado[from]
    } else {
      await sock.sendMessage(from,{text:`${stages[partida.errores]}\n\n❌ No tiene "${letra}" | Quedan ${stages.length - 1 - partida.errores}\n${ocultar(partida.palabra, partida.letras)}`},{quoted:m})
    }
  }
}
