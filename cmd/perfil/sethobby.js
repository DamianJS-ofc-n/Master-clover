import { getUser, updateUser } from '../../lib/db.js'

export const handler = {}
handler.name = 'sethobby'
handler.alias = ['setpasatiempo']
handler.category = 'profile'

handler.exec = async (sock, m, args, ctx) => {
  const sender = ctx.sender
  const user = await getUser(sender)
  const input = args.join(' ').trim()
  const from = m.key.remoteJid

  const pasatiemposDisponibles = [
    '📚 Leer', '✍️ Escribir', '🎤 Cantar', '💃 Bailar', '🎮 Jugar',
    '🎨 Dibujar', '🍳 Cocinar', '✈️ Viajar', '🏊 Nadar', '📸 Fotografía',
    '🎧 Escuchar música', '🏀 Deportes', '🎬 Ver películas', '🌿 Jardinería',
    '🧵 Manualidades', '🎲 Juegos de mesa', '🏋️‍♂️ Gimnasio', '🚴 Ciclismo',
    '🎯 Tiro con arco', '🍵 Ceremonia del té', '🧘‍♂️ Meditación', '🎪 Malabares',
    '🛠️ Bricolaje', '🎹 Tocar instrumentos', '🐶 Cuidar mascotas', '🌌 Astronomía',
    '♟️ Ajedrez', '🍷 Catación de vinos', '🛍️ Compras', '🏕️ Acampar',
    '🎣 Pescar', '📱 Tecnología', '🎭 Teatro', '🍽️ Gastronomía', '🏺 Coleccionar',
    '✂️ Costura', '🧁 Repostería', '📝 Blogging', '🚗 Automóviles', '🧩 Rompecabezas',
    '🎳 Bolos', '🏄 Surf', '⛷️ Esquí', '🎿 Snowboard', '🤿 Buceo', '🏹 Tiro al blanco',
    '🧭 Orientación', '🏇 Equitación', '🎨 Pintura', '📊 Invertir', '🌡️ Meteorología',
    '🔍 Investigar', '💄 Maquillaje', '💇‍♂️ Peluquería', '🛌 Dormir', '🍺 Cervecería',
    '🪓 Carpintería', '🧪 Experimentos', '📻 Radioafición', '🗺️ Geografía', '💎 Joyería',
    'Otro 🌟'
  ]

  if (input === 'delete' || input === 'eliminar' || input === 'remove') {
    if (!user?.hobby || user?.hobby === 'No definido' || user.hobby === 'Not set') {
      return sock.sendMessage(from, { text: '✐ *No tienes un pasatiempo establecido para eliminar.*' }, { quoted: m })
    }
    await updateUser(sender, { hobby: null })
    return sock.sendMessage(from, { text: '✐ *Tu pasatiempo ha sido eliminado correctamente.*' }, { quoted: m })
  }

  if (user?.hobby && user.hobby !== 'No definido' && user.hobby !== 'Not set') {
    return sock.sendMessage(from, { text: `✐ Ya tienes un pasatiempo. Usa › *.sethobby delete* para eliminarlo.` }, { quoted: m })
  }

  if (!input) {
    let lista = `*Elige un pasatiempo:*\n\n`
    pasatiemposDisponibles.forEach((pasatiempo, index) => {
      lista += `${index + 1}) ${pasatiempo}\n`
    })
    lista += `\n*Ejemplos:*\n.sethobby 1\n.sethobby Leer\n.sethobby delete`
    return sock.sendMessage(from, { text: lista }, { quoted: m })
  }

  let pasatiempoSeleccionado = ''

  if (/^\d+$/.test(input)) {
    const index = parseInt(input) - 1
    if (index >= 0 && index < pasatiemposDisponibles.length) {
      pasatiempoSeleccionado = pasatiemposDisponibles[index]
    } else {
      return sock.sendMessage(from, { text: `《✧》 Número inválido. Selecciona un número entre 1 y ${pasatiemposDisponibles.length}` }, { quoted: m })
    }
  } else {
    const inputLimpio = input.replace(/[^\w\s]/g, '').toLowerCase().trim()
    const encontrado = pasatiemposDisponibles.find(
      p => p.replace(/[^\w\s]/g, '').toLowerCase().includes(inputLimpio)
    )
    if (encontrado) {
      pasatiempoSeleccionado = encontrado
    } else {
      return sock.sendMessage(from, { text: '《✧》 Pasatiempo no encontrado. Usa el comando sin argumentos para ver la lista disponible.' }, { quoted: m })
    }
  }

  await updateUser(sender, { hobby: pasatiempoSeleccionado })
  return sock.sendMessage(from, { text: `✐ Se ha establecido tu pasatiempo:\n> *${pasatiempoSeleccionado}*` }, { quoted: m })
}

export default handler