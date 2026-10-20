export const handler = {}
handler.name = 'allbirths'
handler.alias = ['allbirth','cumples']
handler.category = 'general'
handler.description = 'Ver todos los cumples'
const diasSemana = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado']
const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
function getNextBirthday(dateStr){
  let base = new Date(dateStr); if(isNaN(base)) return null
  let now = new Date()
  let next = new Date(now.getFullYear(), base.getMonth(), base.getDate())
  if(next < now) next.setFullYear(now.getFullYear()+1)
  let diff = next - now
  return { next, days: Math.floor(diff/86400000), hours: Math.floor(diff%86400000/3600000), mins: Math.floor(diff%3600000/60000), secs: Math.floor(diff%60000/1000), formatted: `${diasSemana[next.getDay()]}, ${next.getDate()} de ${meses[next.getMonth()]}` }
}
handler.exec = async (sock, m) => {
  const jid = m.key.remoteJid
  let groupName = 'este grupo'
  try{ if(jid.endsWith('@g.us')){ let meta = await sock.groupMetadata(jid); groupName = meta.subject } }catch{}
  const db = global.db?.data?.users || {}
  let list = []
  for(let id in db){ if(!db[id].birthday) continue; let info = getNextBirthday(db[id].birthday); if(!info) continue; list.push({ name: db[id].name || id.split('@')[0], ...info }) }
  if(!list.length) return sock.sendMessage(jid, { text: 'No hay cumpleaños registrados.' }, { quoted: m })
  list.sort((a,b)=>a.next-b.next)
  let txt = `「✿」Cumpleaños en *${groupName}*:\n\n`
  for(let u of list){ txt += `♚ ִ   ★!̼ܵ    ${u.name} » *${u.formatted}*\n\t\t→ _${u.days} días ${u.hours} horas ${u.mins} minutos ${u.secs} segundos_\n\n` }
  await sock.sendMessage(jid, { text: txt.trim() }, { quoted: m })
}
