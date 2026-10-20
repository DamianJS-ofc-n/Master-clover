export const handler = {}
handler.name = 'warns'
handler.alias = ['listwarns']
handler.category = 'Admin'
handler.exec = async (sock, m) => {
  let jid = m.key.remoteJid
  let meta = await sock.groupMetadata(jid)
  let who = m.mentionedJid?.[0] || m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.quoted?.sender || null

  if (who) {
    let data = global.db.data.users[who]
    if (!data ||!data.warns || data.warns.length === 0) return sock.sendMessage(jid, { text: `✐ @${who.split('@')[0]} no tiene advertencias`, mentions: [who] }, { quoted: m })
    let total = data.warns.length
    let txt = `✐ Advertencias de @${who.split('@')[0]}\n> ✧ Total de advertencias: \`${total}\`\n\n`
    txt += data.warns.map((w,i) => `\`#${i+1}\` » ${w.razon}\n> » Fecha: ${w.fecha}\n> » Por: @${w.by.split('@')[0]} 🦎`).join('\n\n')
    await sock.sendMessage(jid, { text: txt, mentions: [who,...data.warns.map(w => w.by)] }, { quoted: m })
  } else {
    let db = global.db.data.users
    let conWarns = Object.keys(db).filter(id => db[id].warns && db[id].warns.length > 0)
    if (conWarns.length === 0) return sock.sendMessage(jid, { text: '✐ No hay usuarios con advertencias' }, { quoted: m })
    let txt = `✐ Advertencias de ${meta.subject}\n> ✧ Total de usuarios: \`${conWarns.length}\`\n\n`
    for (let id of conWarns) {
      txt += `✧ @${id.split('@')[0]} » ${db[id].warns.length} warns\n`
    }
    await sock.sendMessage(jid, { text: txt, mentions: conWarns }, { quoted: m })
  }
}
