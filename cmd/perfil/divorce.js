import { getUser, updateUser } from '../../lib/db.js'

export const handler = {}
handler.name = 'divorce'
handler.alias = ['divorciar']
handler.category = 'profile'

handler.exec = async (sock, m, args, ctx) => {
  const sender = ctx.sender
  const user = await getUser(sender)
  const partnerId = user?.marry

  if (!partnerId || partnerId === 'Sin matrimonio' || partnerId === 'Single') {
    return sock.sendMessage(m.key.remoteJid, { text: '《✧》 No estás casado con nadie.' }, { quoted: m })
  }

  const partner = await getUser(partnerId)
  
  await updateUser(sender, { marry: null })
  await updateUser(partnerId, { marry: null })

  const userName = user?.name || sender
  const partnerName = partner?.name || partnerId

  return sock.sendMessage(m.key.remoteJid, { text: `✎ *${userName}* te has divorciado de *${partnerName}*.` }, { quoted: m })
}

export default handler