global.partidasAhorcado = global.partidasAhorcado || {}
function ocultar(p,l){return p.split('').map(x=>l.includes(x)?x:'_').join(' ')}

export const handler = {}
handler.name = 'ahorcado'
handler.alias = ['ahorcado']
handler.category = 'fun'
handler.description = 'Inicia el ahorcado kitsune'

handler.exec = async (sock, m) => {
  const from = m.key.remoteJid
  const palabras = ["kitsune","zorro","templo","sakura","yokai","inari","miko","katana","oni","torii","yuki","kimono"]
  const palabra = palabras[Math.floor(Math.random()*palabras.length)]
  global.partidasAhorcado[from] = { palabra, letras: [], errores: 0, jugador: m.pushName || 'Jugador' }
  await sock.sendMessage(from,{text:`🦊⛩️ *AHORCADO KITSUNE* ⛩️🦊\n\nPalabra: ${ocultar(palabra, [])}\n\nUsa *.letra a* para adivinar`},{quoted:m})
}
