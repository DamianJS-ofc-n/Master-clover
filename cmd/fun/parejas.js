export const handler = {}
handler.name = 'parejas'
handler.alias = ['pareja','ship','ships']
handler.category = 'general'
handler.description = 'Forma parejas random del grupo'

function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){
    const j=Math.floor(Math.random()* (i+1))
    ;[arr[i],arr[j]]=[arr[j],arr[i]]
  }
  return arr
}

handler.exec = async (sock, m) => {
  const from = m.key.remoteJid
  if(!from.endsWith('@g.us')){
    return await sock.sendMessage(from,{text:'> ✧ Este comando solo funciona en grupos'}, {quoted:m})
  }

  const body = m.message?.conversation || m.message?.extendedTextMessage?.text || ''
  const args = body.trim().split(/ +/)
  let num = parseInt(args[1]) || 1
  if(num < 1) num = 1
  if(num > 10) num = 10 // anti spam

  const metadata = await sock.groupMetadata(from)
  let participants = metadata.participants.map(p=>p.id)

  // si menciona a alguien, lo metemos si o si
  const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
  if(mentioned.length > 0){
    // ponemos los mencionados al inicio
    participants = [...mentioned,...participants.filter(id=>!mentioned.includes(id))]
  }

  participants = shuffle(participants)

  if(participants.length < 2){
    return await sock.sendMessage(from,{text:'> ✧ No hay suficientes personas en el grupo'}, {quoted:m})
  }

  let parejas = []
  let usados = new Set()
  let texto = `╭─ *💘 PAREJAS RANDOM* ─╮\n`

  let intentos = 0
  for(let i=0; i<num; i++){
    // buscamos 2 que no se hayan usado
    let disponibles = participants.filter(id=>!usados.has(id))
    if(disponibles.length < 2) break

    disponibles = shuffle(disponibles)
    const p1 = disponibles[0]
    const p2 = disponibles[1]

    usados.add(p1)
    usados.add(p2)

    parejas.push([p1,p2])
  }

  if(parejas.length === 0){
    return await sock.sendMessage(from,{text:'> ✧ No se pudieron formar parejas'}, {quoted:m})
  }

  for(let i=0;i<parejas.length;i++){
    const [a,b] = parejas[i]
    const por = Math.floor(Math.random()*41)+60 // 60% a 100%
    texto += `│\n│ ${i+1}. @${a.split('@')[0]} ❤️ @${b.split('@')[0]}\n│ ↳ *Compatibilidad: ${por}%* ${por>85?'💖':por>75?'💕':'💞'}\n`
  }

  texto += `╰─────────────────\n> ★ Se formaron ${parejas.length} parejitas`

  const allMentions = parejas.flat()

  await sock.sendMessage(from, {
    text: texto,
    mentions: allMentions
  }, { quoted: m })
}
