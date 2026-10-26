import config from '../../config.js'
import fs from 'fs'
export const handler = {}
handler.name = 'getcode'
handler.alias = ['getfile', 'gc']
handler.category = 'owner'
handler.description = 'Manda el código en texto'
handler.owner = true
function getOwners(){return (config?.bot?.owner||[]).map(n=>n.toString().split('@')[0].replace(/\D/g,'')).filter(Boolean)}
function isOwnerDirect(m){let raw=m.key?.participant||m.key?.remoteJid||'';let c=raw.split('@')[0].split(':')[0].replace(/\D/g,'');if(m.key?.fromMe)return true;return getOwners().includes(c)||config.bot.owner.includes(raw)}
function split(t,n=3500){let r=[];for(let i=0;i<t.length;i+=n)r.push(t.slice(i,i+n));return r}
handler.exec = async (sock, m, args) => {
 if(!isOwnerDirect(m)) return await sock.sendMessage(m.key.remoteJid, { text: '⚠️ Solo owners pueden usar esto.' }, { quoted: m })
 let jid = m.key.remoteJid
 let filePath = args.join(' ').trim().replace(/^\.\//, '')
 if (!filePath) return sock.sendMessage(jid, { text: `🌾 Uso: .getcode main.js\n.getcode config.js\n.getcode cmd/owner/r.js` }, { quoted: m })
 if (!fs.existsSync(filePath)) return sock.sendMessage(jid, { text: `⚠️ No encontré el archivo: ${filePath}` }, { quoted: m })
 if(fs.statSync(filePath).isDirectory()) return sock.sendMessage(jid, { text: `🌀 Es carpeta` }, { quoted: m })
 let code = fs.readFileSync(filePath, 'utf-8')
 if(!code.trim()) return sock.sendMessage(jid, { text: `⚠️ Archivo vacío: ${filePath}` }, { quoted: m })
 if(code.length <= 3500){
 return await sock.sendMessage(jid, { text: `🌾 *${filePath}*\n\`\`\`js\n${code}\n\`\`\`` }, { quoted: m })
 } else {
 let parts = split(code)
 await sock.sendMessage(jid, { text: `🌾 *${filePath}* - ${code.length} chars, ${parts.length} partes` }, { quoted: m })
 for(let i=0;i<parts.length;i++){
 await sock.sendMessage(jid, { text: `\`\`\`js\n${parts[i]}\n\`\`\`\n*Parte ${i+1}/${parts.length}*` }, { quoted: m })
 await new Promise(r=>setTimeout(r,400))
 }
 }
}
export default handler
