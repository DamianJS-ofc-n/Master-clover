export const handler = {}
handler.name = 'top'
handler.alias = ['tops']
handler.category = 'fun'
handler.description = 'Top 10 del grupo'
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]] } return a }
handler.exec = async (sock, m) => {
  const from = m.key.remoteJid
  if(!from.endsWith('@g.us')) return await sock.sendMessage(from,{text:'> Solo en grupos'},{quoted:m})
  const body = m.message?.conversation || m.message?.extendedTextMessage?.text || ''
  const texto = body.split(/ +/).slice(1).join(' ') || 'gays'
  const meta = await sock.groupMetadata(from)
  let parts = shuffle([...meta.participants.map(p=>p.id)]).slice(0,10)
  let txt = `╭─ *TOP 10 ${texto.toUpperCase()}* ─╮\n`
  parts.forEach((id,i)=>{
    const puesto = i==0?'🥇':i==1?'🥈':i==2?'🥉':` ${i+1}.`
    txt+=`│ ${puesto} @${id.split('@')[0]}\n`
  })
  txt+=`╰───────────────`
  await sock.sendMessage(from,{text:txt, mentions:parts},{quoted:m})
}
