import { getUser, updateUser } from '../../lib/db.js'

export const handler = {}
handler.name = 'delgenre'
handler.alias = ['delgenero']
handler.category = 'profile'

handler.exec = async (sock, m, args, ctx) => {
  const sender = ctx.sender
  const user = await getUser(sender)

  if (!user?.genre || user.genre === 'No definido' || user.genre === 'Not set') {
    return sock.sendMessage(m.key.remoteJid, { text: 'ꕥ *No tienes un género establecido para eliminar.*' }, { quoted: m })
  }

  await updateUser(sender, { genre: null })
  return sock.sendMessage(m.key.remoteJid, { text: '✎ *Tu género ha sido eliminado correctamente.*' }, { quoted: m })
}

export default handler