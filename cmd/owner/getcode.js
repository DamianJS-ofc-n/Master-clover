import config from '../../config.js'
import fs from 'fs'
import path from 'path'

export const handler = {}
handler.name = 'getcode'
handler.alias = ['getfile', 'gc']
handler.category = 'owner'
handler.description = 'Manda el archivo como .js'
handler.owner = true

function getOwners(){return (config?.bot?.owner||[]).map(n=>n.toString().split('@')[0].replace(/\D/g,'')).filter(Boolean)}
function isOwnerDirect(m){
 let raw=m.key?.participant||m.key?.remoteJid||''
 let c=raw.split('@')[0].split(':')[0].replace(/\D/g,'')
 if(m.key?.fromMe) return true
 return getOwners().includes(c)||config.bot.owner.includes(raw)
}

handler.exec = async (sock, m, args) => {
 if(!isOwnerDirect(m)) return await sock.sendMessage(m.key.remoteJid, { text: '⚠️ Solo owners pueden usar esto.' }, { quoted: m })
 let jid = m.key.remoteJid
 let filePath = args.join(' ').trim().replace(/^\.\//, '')
 if (!filePath) return sock.sendMessage(jid, { text: `🌾 Uso: .getcode main.js\n.getcode config.js\n.getcode cmd/owner/r.js\n.getcode core/menudiseños.js` }, { quoted: m })
 if (!fs.existsSync(filePath)) return sock.sendMessage(jid, { text: `⚠️ No encontré: ${filePath}` }, { quoted: m })
 if(fs.statSync(filePath).isDirectory()){
 let files = fs.readdirSync(filePath).filter(f=>f.endsWith('.js'))
 return sock.sendMessage(jid, { text: `🌀 Es carpeta: ${filePath}\n\nUsa uno de estos:\n${files.map(f=>`• .getcode ${path.join(filePath,f)}`).join('\n')}` }, { quoted: m })
 }

 let code = fs.readFileSync(filePath)
 if(!code.length) return sock.sendMessage(jid, { text: `⚠️ Archivo vacío: ${filePath}` }, { quoted: m })

 let fileName = path.basename(filePath)
 // Si no termina en .js, igual lo manda con su nombre
 await sock.sendMessage(jid, {
 document: code,
 fileName: fileName,
 mimetype: 'application/javascript',
 caption: `🌾 *${filePath}*\n📦 ${(code.length/1024).toFixed(1)} KB\nDescargalo y pisalo en tu bot.`
 }, { quoted: m })
}
export default handler
