import { getUser, updateUser } from '../../lib/db.js'

export const handler = {}
handler.name = 'setbirth'
handler.alias = ['setfecha', 'setnacimiento']
handler.category = 'profile'

handler.exec = async (sock, m, args, ctx) => {
  const sender = ctx.sender
  const user = await getUser(sender)
  const currentYear = new Date().getFullYear()
  const input = args.join(' ')
  const from = m.key.remoteJid

  if (input === 'delete' || input === 'eliminar' || input === 'remove') {
    if (!user?.birthday || user?.birthday === 'No definido' || user.birthday === 'Not set') {
      return sock.sendMessage(from, { text: '✎ *No tienes una fecha de nacimiento establecida para eliminar.*' }, { quoted: m })
    }
    await updateUser(sender, { birthday: null })
    return sock.sendMessage(from, { text: '✎ *Tu fecha de nacimiento ha sido eliminada correctamente.*' }, { quoted: m })
  }

  if (user?.birthday && user.birthday !== 'No definido' && user.birthday !== 'Not set') {
    return sock.sendMessage(from, { text: `✎ Ya tienes una fecha establecida. Usa › *.setbirth delete* para eliminarla.` }, { quoted: m })
  }

  if (!input) {
    return sock.sendMessage(from, { text: `《✧》 Debes ingresar una fecha válida.\n\n*Ejemplos:*\n.setbirth 01/01/2000\n.setbirth 01/01\n.setbirth delete` }, { quoted: m })
  }

  const birth = validarFechaNacimiento(input, currentYear)
  if (!birth) {
    return sock.sendMessage(from, { text: `《✧》 Fecha inválida. Usa › *.setbirth 01/01/2000*` }, { quoted: m })
  }

  await updateUser(sender, { birthday: birth })
  return sock.sendMessage(from, { text: `✎ Se ha establecido tu fecha de nacimiento como: *${birth}*` }, { quoted: m })
}

function validarFechaNacimiento(text, currentYear) {
  const formatos = [
    /^\d{1,2}\/\d{1,2}\/\d{4}$/,
    /^\d{1,2}\/\d{1,2}$/,
    /^\d{1,2} \w+$/,
    /^\d{1,2} \w+ \d{4}$/,
  ]
  if (!formatos.some((r) => r.test(text))) return null

  let dia, mes, año
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(text)) {
    [dia, mes, año] = text.split('/').map(Number)
  } else if (/^\d{1,2}\/\d{1,2}$/.test(text)) {
    [dia, mes] = text.split('/').map(Number)
    año = currentYear
  } else {
    const partes = text.split(' ')
    dia = parseInt(partes[0])
    mes = new Date(`${partes[1]} 1`).getMonth() + 1
    año = partes[2] ? parseInt(partes[2]) : currentYear
  }

  if (año > currentYear) return null

  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  const diasPorSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
  const diasPorMes = [31, (año % 4 === 0 && año % 100 !== 0) || año % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

  while (dia > diasPorMes[mes - 1]) {
    dia -= diasPorMes[mes - 1]
    mes++
    if (mes > 12) {
      mes = 1
      año++
    }
  }

  const fecha = new Date(`${año}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`)
  const diaSemana = diasPorSemana[fecha.getUTCDay()]
  return `${diaSemana}, ${dia} de ${meses[mes - 1]}`
}

export default handler