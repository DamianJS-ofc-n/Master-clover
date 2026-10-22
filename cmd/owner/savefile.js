import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../../config.js'
import { isOwnerCheck } from '../../lib/isOwner.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const handler = {}
handler.name = 'savefile'
handler.alias = []
handler.category = 'owner'
handler.owner = true

handler.exec = async (...args) => {
 let sock, m, a
 if (args[0]?.key) { m = args[0]; sock = args[1]?.conn || global.conn; a = args[1]?.args || [] }
 else { sock = args[0]; m = args[1]; a = args[2] || [] }

 let jid = m.key.remoteJid
 try {
 if (!a?.length) {
 return sock.sendMessage(jid, { text: `✳️ Uso: ${config.prefix}savefile <ruta> respondiendo a un texto` }, { quoted: m })
 }
 const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
 if (!quoted) return sock.sendMessage(jid, { text: `❌ Debes responder a un mensaje de texto` }, { quoted: m })
 const type = Object.keys(quoted)[0]
 if (type!== 'conversation' && type!== 'extendedTextMessage') return sock.sendMessage(jid, { text: `❌ Debes responder a un texto` }, { quoted: m })
 const texto = quoted.conversation || quoted.extendedTextMessage?.text || ''
 if (!texto.trim()) return sock.sendMessage(jid, { text: `❌ El texto esta vacio` }, { quoted: m })
 const fileName = a[0]
 if (fileName.includes('..')) return sock.sendMessage(jid, { text: `❌ Nombre no valido` }, { quoted: m })
 const baseDir = path.join(__dirname, '../..')
 const filePath = path.join(baseDir, fileName)
 const dirPath = path.dirname(filePath)
 if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true })
 const exists = fs.existsSync(filePath)
 fs.writeFileSync(filePath, texto, 'utf8')
 const stats = fs.statSync(filePath)
 return sock.sendMessage(jid, { text: `${exists?'✅ Actualizado':'✅ Creado'}\n✳️ ${fileName}\n✳️ ${stats.size} bytes` }, { quoted: m })
 } catch (e) {
 return sock.sendMessage(jid, { text: `❌ Error: ${e.message}` }, { quoted: m })
 }
}
