export const handler = {}
handler.name = 'bunker'
handler.alias = ['apocalipsis','refugio']
handler.category = 'fun'
handler.description = 'Inicia el apocalipsis, solo 3 sobreviven'

handler.exec = async (sock, m) => {
  const chatId = m.key.remoteJid
  if(!chatId.endsWith('@g.us')) return sock.sendMessage(chatId,{text:"Solo grupos"}, {quoted:m})
  if(!global.bunkerGames) global.bunkerGames = new Map()
  if(global.bunkerGames.has(chatId)) return sock.sendMessage(chatId,{text:"☢️ Ya hay bunker activo"}, {quoted:m})
  const meta = await sock.groupMetadata(chatId)
  const parts = meta.participants.sort(()=>0.5-Math.random()).slice(0,6)
  const roles = ["Médico hipocondríaco","Chef que se comió reservas","Soldado sin balas","Ingeniero sin título","Influencer","Payaso que da miedo"]
  const players = parts.map((p,i)=>({id:p.id, num:i+1, rol:roles[i], votos:0, votantes:[]}))
  global.bunkerGames.set(chatId, {players})
  const lista = players.map(p=>`${p.num}. @${p.id.split('@')[0]} - ${p.rol}`).join("\n")
  await sock.sendMessage(chatId,{text:`☢️ *BUNKER - SOLO 3 ENTRAN* ☢️\n\n${lista}\n\n🗳️ Voten a quien SALVAR con.bvotar [numero]\n60s`, mentions:players.map(p=>p.id)})
  setTimeout(async ()=>{
    const game = global.bunkerGames.get(chatId); if(!game) return
    global.bunkerGames.delete(chatId)
    const orden = [...game.players].sort((a,b)=> b.votos!==a.votos? b.votos-a.votos : 0.5-Math.random())
    const vivos = orden.slice(0,3)
    const muertos = orden.slice(3)
    await sock.sendMessage(chatId,{text:`☢️ *BUNKER CERRADO* ☢️\n\n✅ ENTRAN:\n${vivos.map(p=>`@${p.id.split('@')[0]} (${p.votos} votos)`).join("\n")}\n\n💀 MUEREN:\n${muertos.map(p=>`@${p.id.split('@')[0]} (${p.votos} votos)`).join("\n")}`, mentions:[...vivos,...muertos].map(p=>p.id)})
  }, 60000)
}