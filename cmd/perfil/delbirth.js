import { getUser, updateUser } from '../../lib/db.js'

export const handler = {}
handler.name = 'delbirth'
handler.alias = ['delfecha', 'deletebirth']
handler.category = 'profile'

handler.exec = async (sock, m, args, ctx) => {
  const sender = ctx.sender
  const user = await getUser(sender)

  if (!user?.birthday || user.birthday === 'No definido' || user.birthday === 'Not set') {
    return sock.sendMessage(m.key.remoteJid, { text: '✎ *No tienes una fecha de nacimiento establecida para eliminar.*' }, { quoted: m })
  }

  await updateUser(sender, { birthday: null })
  return sock.sendMessage(m.key.remoteJid, { text: '✎ *Tu fecha de nacimiento ha sido eliminada correctamente.*' }, { quoted: m })
}

export default handler