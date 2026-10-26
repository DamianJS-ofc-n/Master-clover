import config from '../../config.js'
import fs from 'fs'
import path from 'path'
export const handler = {}
handler.name = 'savefile'
handler.alias = ['sf','save']
handler.category = 'owner'
handler.owner = true
function getOwners(){return (config?.bot?.owner||[]).map(n=>n.toString().split('@')[0].replace(/\D/g,'')).filter(Boolean)}
function isOwnerDirect(m){let raw=m.key?.participant||m.key?.remoteJid||'';let c=raw.split('@')[0].split(':')[0].replace(/\D/g,'');if(m.key?.fromMe)return true;return getOwners().includes(c)||config.bot.owner.includes(raw)}
handler.exec = async (sock, m, args) => {
 if(!isOwnerDirect(m)) return await sock.sendMessage(m.key.remoteJid, { text: '⚠️ Solo owners pueden usar esto.' }, { quoted: m })
 let jid=m.key.remoteJid
 let filePath = args[0]
 if(!filePath) return await sock.sendMessage(jid, { text: `Uso: .savefile ruta/archivo.js` }, { quoted: m })
 let code = m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation || m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text
 if(!code && args.length>1) code = args.slice(1).join(' ')
 if(!code) return await sock.sendMessage(jid, { text: `❌ Responde a un mensaje con código o pon el código después de la ruta` }, { quoted: m })
 try{
 let dir=path.dirname(filePath)
 if(!fs.existsSync(dir)) fs.mkdirSync(dir,{recursive:true})
 fs.writeFileSync(filePath, code)
 await sock.sendMessage(jid, { text: `✅ Guardado: ${filePath}` }, { quoted: m })
 }catch(e){ await sock.sendMessage(jid, { text: `❌ Error: ${e.message}` }, { quoted: m })}
}
export default handler
