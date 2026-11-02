import { getUser, updateUser } from '../../lib/db.js'

export const handler = {}
handler.name = 'setedad'
handler.alias = ['setage']
handler.category = 'profile'

handler.exec = async (sock, m, args, ctx) => {
  const sender = ctx.sender
  const user = await getUser(sender)
  const input = args.join(' ').trim()
  const from = m.key.remoteJid

  if (input === 'delete' || input === 'eliminar' || input === 'remove') {
    if (!user?.edad) {
      return sock.sendMessage(from, { text: '✐ *No tienes una edad establecida para eliminar.*' }, { quoted: m })
    }
    await updateUser(sender, { edad: null })
    return sock.sendMessage(from, { text: '✐ *Tu edad ha sido eliminada correctamente.*' }, { quoted: m })
  }

  if (!input) {
    return sock.sendMessage(from, { text: `《✧》 Debes ingresar una edad válida.\n\n*Ejemplo:*\n.setedad 25\n.setedad delete` }, { quoted: m })
  }

  const age = parseInt(input)
  
  if (isNaN(age) || age < 1 || age > 120) {
    return sock.sendMessage(from, { text: `《✧》 Edad inválida. Por favor, ingresa un número entre 1 y 120.` }, { quoted: m })
  }

  await updateUser(sender, { edad: age })
  return sock.sendMessage(from, { text: `✎ Se ha establecido tu edad como: *${age}*` }, { quoted: m })
}

export default handler