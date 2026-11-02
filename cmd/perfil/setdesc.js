import { getUser, updateUser } from '../../lib/db.js'

export const handler = {}
handler.name = 'setdesc'
handler.alias = ['setdescription']
handler.category = 'profile'

handler.exec = async (sock, m, args, ctx) => {
  const sender = ctx.sender
  const user = await getUser(sender)
  const input = args.join(' ')
  const from = m.key.remoteJid

  if (input === 'delete' || input === 'eliminar' || input === 'remove') {
    if (!user?.description || user?.description === 'No definido' || user.description === 'Not set') {
      return sock.sendMessage(from, { text: '✐ *No tienes una descripción establecida para eliminar.*' }, { quoted: m })
    }
    await updateUser(sender, { description: null })
    return sock.sendMessage(from, { text: '✐ *Tu descripción ha sido eliminada correctamente.*' }, { quoted: m })
  }

  if (user?.description && user.description !== 'No definido' && user.description !== 'Not set') {
    return sock.sendMessage(from, { text: `✐ Ya tienes una descripción. Usa › *.setdesc delete* para eliminarla.` }, { quoted: m })
  }

  if (!input) {
    return sock.sendMessage(from, { text: `《✧》 Debes especificar una descripción válida.\n> Ejemplo: .setdesc Me gusta programar` }, { quoted: m })
  }

  await updateUser(sender, { description: input })
  return sock.sendMessage(from, { text: `✐ Se ha establecido tu descripción:\n> *${input}*` }, { quoted: m })
}

export default handler