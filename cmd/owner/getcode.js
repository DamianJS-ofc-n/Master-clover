import fs from 'fs'
import path from 'path'

let config = { channels: { id: '', cname: 'Bot' } }
try {
 const mod = await import('../config.js')
 config = mod.default || mod.config || config
} catch {
 try {
 const mod2 = await import('../../config.js')
 config = mod2.default || mod2.config || config
 } catch {}
}

export const handler = {}
handler.name = 'getcode'
handler.alias = ['getfile', 'gc']
handler.category = 'owner'
handler.description = 'Obtiene el codigo de un archivo'
handler.owner = true

handler.exec = async (sock, m, args) => {
 const text = args.join(' ').trim()
 if (!text) return sock.sendMessage(m.key.remoteJid, { 
 text: `Uso: .getcode cmd/menu.js\nEj: .getcode config.js` 
 }, { quoted: m })

 let filePath = text.replace(/^\.\//, '')
 if (!fs.existsSync(filePath)) {
 return sock.sendMessage(m.key.remoteJid, { text: `❌ No existe: *${filePath}*` }, { quoted: m })
 }
 if (fs.statSync(filePath).isDirectory()) {
 return sock.sendMessage(m.key.remoteJid, { text: `❌ Es una carpeta` }, { quoted: m })
 }

 let code = fs.readFileSync(filePath, 'utf-8')
 if (code.length > 400000) code = code.slice(0, 400000) + '\n// ...recortado'

 await sock.sendMessage(m.key.remoteJid, {
 document: Buffer.from(code),
 mimetype: 'text/javascript',
 fileName: path.basename(filePath),
 caption: `✅ ${filePath} - ${code.length} chars`,
 contextInfo: {
 forwardingScore: 999,
 isForwarded: true,
 forwardedNewsletterMessageInfo: {
 newsletterJid: config.channels?.id || '',
 newsletterName: config.channels?.cname || 'Bot',
 serverMessageId: -1
 }
 }
 }, { quoted: m })
}
