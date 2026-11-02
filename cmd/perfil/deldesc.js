import { getUser, updateUser } from '../../lib/db.js'

export const handler = {}
handler.name = 'deldesc'
handler.alias = ['deldescription', 'deletedescription']
handler.category = 'profile'

handler.exec = async (sock, m, args, ctx) => {
  const sender = ctx.sender
  const user = await getUser(sender)

  if (!user?.description || user.description === 'No definido' || user.description === 'Not set') {
    return sock.sendMessage(m.key.remoteJid, { text: '✐ *No tienes una descripción establecida para eliminar.*' }, { quoted: m })
  }

  await updateUser(sender, { description: null })
  return sock.sendMessage(m.key.remoteJid, { text: '✐ *Tu descripción ha sido eliminada correctamente.*' }, { quoted: m })
}

export default handler