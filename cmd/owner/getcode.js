import { isOwnerCheck } from '../../lib/isOwner.js'
import fs from 'fs'
import path from 'path'

export const handler = {}
handler.name = 'getcode'
handler.alias = ['getfile', 'gc']
handler.category = 'owner'
handler.description = 'Manda un archivo del bot'
handler.owner = true

handler.exec = async (sock, m, args) => {
 // === OWNER CHECK INDEPENDIENTE DE MAIN ===
 let senderRaw = m.key?.participant || m.key?.remoteJid || ''
 let senderClean = senderRaw.split('@')[0].split(':')[0].replace(/\D/g,'')
 // intenta resolver si viene args extra
 let senderResolved = args?.__senderResolved || senderClean
 if(!isOwnerCheck(senderRaw, senderResolved, senderClean) && !m.key?.fromMe) return

 let jid = m.key.remoteJid
 let filePath = args.join(' ').trim().replace(/^\.\//, '')
 if (!filePath) return sock.sendMessage(jid, { text: `Uso: .getcode main.js\n.getcode config.js` }, { quoted: m })
 if (!fs.existsSync(filePath)) return sock.sendMessage(jid, { text: `❌ No existe: ${filePath}` }, { quoted: m })
 let code = fs.readFileSync(filePath, 'utf-8')
 await sock.sendMessage(jid, { document: Buffer.from(code), mimetype: 'text/javascript', fileName: path.basename(filePath), caption: `✅ ${filePath}` }, { quoted: m })
}
export default handler
