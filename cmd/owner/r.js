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

function getOwnersFromConfig() {
 let list = config?.bot?.owner || []
 return list.map(n => n.toString().split('@')[0].replace(/\D/g,'')).filter(Boolean)
}

function isOwnerDirect(m) {
 let raw = m.key?.participant || m.key?.remoteJid || ''
 let clean = raw.split('@')[0].split(':')[0].replace(/\D/g,'')
 if (m.key?.fromMe) return true
 let owners = getOwnersFromConfig()
 return owners.includes(clean) || config.bot.owner.includes(raw)
}

function splitMessage(text, maxLen = 3800) {
 let chunks = []
 for (let i = 0; i < text.length; i += maxLen) {
 chunks.push(text.slice(i, i + maxLen))
 }
 return chunks
}

handler.exec = async (sock, m, args) => {
 if (!isOwnerDirect(m)) {
 return await sock.sendMessage(m.key.remoteJid, { text: '⚠️ Solo owners pueden usar esto.' }, { quoted: m })
 }

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
 const { stdout, stderr } = await execAsync(command, { timeout: 60000, maxBuffer: 1024 * 1024 * 20 })
 let output = (stdout || stderr || 'Sin salida').trim()

 if (!output) output = 'Sin salida'

 // Si es corto, manda en 1
 if (output.length <= 3800) {
 return await sock.sendMessage(jid, { text: `*⚔️ Resultado:*\n\`\`\`bash\n${output}\n\`\`\`` }, { quoted: m })
 }

 // Si es largo, manda completo en partes
 let parts = splitMessage(output, 3800)
 await sock.sendMessage(jid, { text: `*⚔️ Resultado completo (${parts.length} partes):*\nTotal: ${output.length} caracteres` }, { quoted: m })

 for (let i = 0; i < parts.length; i++) {
 let part = parts[i]
 let header = parts.length > 1 ? `*Parte ${i+1}/${parts.length}:*\n` : ''
 await sock.sendMessage(jid, { text: `${header}\`\`\`bash\n${part}\n\`\`\`` }, { quoted: m })
 // pequeña pausa para no spamear
 await new Promise(r => setTimeout(r, 500))
 }

 } catch (e) {
 let err = (e.stdout || e.stderr || e.message).toString()
 let parts = splitMessage(err, 3800)
 await sock.sendMessage(jid, { text: `*❌ Error (${parts.length} partes):*` }, { quoted: m })
 for (let i = 0; i < parts.length; i++) {
 await sock.sendMessage(jid, { text: `*Parte ${i+1}/${parts.length}:*\n\`\`\`bash\n${parts[i]}\n\`\`\`` }, { quoted: m })
 await new Promise(r => setTimeout(r, 500))
 }
 }
}
export default handler
