import { getUser, updateUser } from '../../lib/db.js'

export const handler = {}
handler.name = 'delhobby'
handler.alias = ['delpasatiempo', 'deletepasatiempo']
handler.category = 'profile'

handler.exec = async (sock, m, args, ctx) => {
  const sender = ctx.sender
  const user = await getUser(sender)

  if (!user?.hobby || user.hobby === 'No definido' || user.hobby === 'Not set') {
    return sock.sendMessage(m.key.remoteJid, { text: '✐ *No tienes un pasatiempo establecido para eliminar.*' }, { quoted: m })
  }

  await updateUser(sender, { hobby: null })
  return sock.sendMessage(m.key.remoteJid, { text: '✐ *Tu pasatiempo ha sido eliminado correctamente.*' }, { quoted: m })
}

export default handler