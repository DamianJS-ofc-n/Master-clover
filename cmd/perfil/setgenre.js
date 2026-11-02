import { getUser, updateUser } from '../../lib/db.js'

export const handler = {}
handler.name = 'setgenre'
handler.alias = ['setgenero']
handler.category = 'profile'

handler.exec = async (sock, m, args, ctx) => {
  const sender = ctx.sender
  const user = await getUser(sender)
  const input = args.join(' ').toLowerCase()
  const from = m.key.remoteJid

  if (input === 'delete' || input === 'eliminar' || input === 'remove') {
    if (!user?.genre || user?.genre === 'No definido' || user.genre === 'Not set') {
      return sock.sendMessage(from, { text: 'ꕥ *No tienes un género establecido para eliminar.*' }, { quoted: m })
    }
    await updateUser(sender, { genre: null })
    return sock.sendMessage(from, { text: '✎ *Tu género ha sido eliminado correctamente.*' }, { quoted: m })
  }

  if (user?.genre && user.genre !== 'No definido' && user.genre !== 'Not set') {
    return sock.sendMessage(from, { text: `ꕥ Ya tienes un género. Usa › *.setgenre delete* para eliminarlo.` }, { quoted: m })
  }

  if (!input) {
    return sock.sendMessage(from, { text: `《✧》 Debes ingresar un género válido.\n\n*Ejemplos:*\n.setgenre hombre\n.setgenre mujer\n.setgenre delete` }, { quoted: m })
  }

  const genre = input === 'hombre' ? 'Hombre' : input === 'mujer' ? 'Mujer' : null
  if (!genre) {
    return sock.sendMessage(from, { text: `《✧》 Elige un género válido.\n*Opciones:* hombre, mujer` }, { quoted: m })
  }

  await updateUser(sender, { genre: genre })
  return sock.sendMessage(from, { text: `✎ Se ha establecido tu género como: *${genre}*` }, { quoted: m })
}

export default handler