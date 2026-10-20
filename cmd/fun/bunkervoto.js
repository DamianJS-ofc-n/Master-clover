export const handler = {}
handler.name = 'bvotar'
handler.alias = ['votarbunker']
handler.category = 'fun'
handler.description = 'Vota para salvar a alguien en el bunker'

handler.exec = async (sock, m, a) => {
  const chatId = m.key.remoteJid
  if(!global.bunkerGames) global.bunkerGames = new Map()
  const game = global.bunkerGames.get(chatId)
  if(!game) return sock.sendMessage(chatId,{text:"❌ No hay bunker activo. Usa.bunker"}, {quoted:m})
  const num = parseInt((a[0]||"").toString().replace(/[^0-9]/g,""))
  if(!num) return sock.sendMessage(chatId,{text:`✳️ Usa:.bvotar 1-${game.players.length}`}, {quoted:m})
  const voter = m.key.participant || m.key.remoteJid
  if(game.players.some(p=>p.votantes.includes(voter))) return sock.sendMessage(chatId,{text:`❌ Ya votaste`}, {quoted:m})
  const target = game.players.find(p=>p.num===num)
  if(!target) return
  target.votos++; target.votantes.push(voter)
  const lista = game.players.map(p=>`${p.num}. @${p.id.split('@')[0]} - ${p.votos} votos`).join("\n")
  await sock.sendMessage(chatId,{text:`🗳️ Voto para salvar al ${num}\n\n${lista}`, mentions:game.players.map(p=>p.id)})
}