import config from '../../config.js'
import { exec } from 'child_process'
import { promisify } from 'util'
const execAsync = promisify(exec)

export const handler = {}
handler.name = 'r'
handler.alias = ['>', '$', 'exec', 'term']
handler.category = 'owner'
handler.description = 'Ejecuta comandos de terminal (solo owner)'
handler.owner = true

handler.exec = async (sock, m, args, extra) => {
  const jid = m.key.remoteJid

  if (!args.length) {
    return await sock.sendMessage(jid, { text: `Uso: ${config.bot.prefix[0]}r ls -la\n${config.bot.prefix[0]}r cat config.js` }, { quoted: m })
  }

  let command = args.join(' ')

  if (command.match(/(rm -rf \/|rm -rf \*|:\(\)\{ :\|:\& \};:)/i)) {
    return await sock.sendMessage(jid, { text: '⚠️ Comando peligroso bloqueado.' }, { quoted: m })
  }

  await sock.sendMessage(jid, { text: `⏳ Ejecutando:\n\`\`\`bash\n${command}\n\`\`\`` }, { quoted: m })

  try {
    const { stdout, stderr } = await execAsync(command, { timeout: 30000, maxBuffer: 1024 * 1024 * 5 })
    let output = (stdout || stderr || 'Sin salida').trim()
    if (output.length > 3500) output = output.slice(0, 3500) + '\n...recortado'
    await sock.sendMessage(jid, { text: `*⚔️ Resultado:*\n\`\`\`bash\n${output}\n\`\`\`` }, { quoted: m })
  } catch (e) {
    let err = (e.stdout || e.stderr || e.message).toString().slice(0, 3500)
    await sock.sendMessage(jid, { text: `*❌ Error:*\n\`\`\`bash\n${err}\n\`\`\`` }, { quoted: m })
  }
}
export default handler