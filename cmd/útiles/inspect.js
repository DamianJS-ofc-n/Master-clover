export const handler = {}
handler.name = 'inspect'
handler.alias = ['inspeccionar','inspector','id']
handler.category = 'General'
handler.description = 'Obtiene ID de grupo o canal'

handler.exec = async (sock, m) => {
  const from = m.key.remoteJid
  const body = m.message?.conversation || m.message?.extendedTextMessage?.text || m.message?.imageMessage?.caption || ''
  const link = body.trim().split(/ +/).slice(1).join(' ').trim()

  if(!link){
    return await sock.sendMessage(from, {
      text: `《✧》 Pasa el link\n\nEjemplo:\n.inspector https://chat.whatsapp.com/xxxxx\n.inspector https://whatsapp.com/channel/xxxxx`
    }, { quoted: m })
  }

  try { await sock.sendMessage(from, { react: { text: '🔍', key: m.key } }) } catch {}

  try {
    // GRUPO
    const inviteCode = link.match(/chat\.whatsapp\.com\/([0-9A-Za-z]{20,26})/i)?.[1]
    if(inviteCode){
      const info = await sock.groupGetInviteInfo(inviteCode)
      await sock.sendMessage(from, { text: info.id }, { quoted: m })
      try { await sock.sendMessage(from, { react: { text: '✅', key: m.key } }) } catch {}
      return
    }

    // CANAL
    const channelCode = link.match(/channel\/([0-9A-Za-z]+)/i)?.[1]
    if(channelCode){
      const info = await sock.newsletterMetadata("invite", channelCode)
      if(!info?.id) throw new Error('No se pudo obtener el ID del canal')
      await sock.sendMessage(from, { text: info.id }, { quoted: m })
      try { await sock.sendMessage(from, { react: { text: '✅', key: m.key } }) } catch {}
      return
    }

    await sock.sendMessage(from, { text: '《✧》 Link no válido' }, { quoted: m })

  } catch(e){
    console.log('Error inspect:', e)
    try { await sock.sendMessage(from, { react: { text: '✖️', key: m.key } }) } catch {}
    await sock.sendMessage(from, { text: `❌ ${e.message}` }, { quoted: m })
  }
}
