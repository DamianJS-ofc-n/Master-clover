import config from '../../config.js'
import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'
export const handler = {}
handler.name = 'detectar'
handler.alias = ['scan', 'corrupcion']
handler.category = 'owner'
handler.description = 'Escanea corrupción de plugins'
function getOwners(){return (config?.bot?.owner||[]).map(n=>n.toString().split('@')[0].replace(/\D/g,'')).filter(Boolean)}
function isOwnerDirect(m){let raw=m.key?.participant||m.key?.remoteJid||'';let c=raw.split('@')[0].split(':')[0].replace(/\D/g,'');if(m.key?.fromMe)return true;return getOwners().includes(c)||config.bot.owner.includes(raw)}
handler.exec = async (sock, m) => {
 if(!isOwnerDirect(m)) return await sock.sendMessage(m.key.remoteJid, { text: '⚠️ Solo owners pueden usar esto.' }, { quoted: m })
 const jid = m.key.remoteJid
 const start = Date.now()
 await sock.sendMessage(jid, { text: `⚔️ *ESCANEANDO BOT*\n\n⏳ Analizando...` }, { quoted: m })
 const getFiles = (dir, list = []) => {
 if (!fs.existsSync(dir)) return list
 for (let f of fs.readdirSync(dir)) {
 let full = path.join(dir, f)
 if (fs.statSync(full).isDirectory()) getFiles(full, list)
 else if (full.endsWith('.js')) list.push(full)
 }
 return list
 }
 let files = [...getFiles('./plugins'), ...getFiles('./cmd')]
 let errores = []
 for (let file of files) {
 try { await import(pathToFileURL(path.resolve(file)).href + `?t=${Date.now()}`) } catch (e) {
 errores.push({ archivo: path.basename(file), motivo: e.message.split('\n')[0].slice(0, 200) })
 }
 }
 let txt = `⛔ *Escaneo de Corrupción* 🎋\n\n📂 *Plugins:* ${files.length}\n━━━━━━━━━━━━\n\n`
 if (errores.length === 0) { txt += `✅ *Sistema limpio*` } 
 else {
 for (let err of errores) { txt += `⚠️ *${err.archivo}*\n👾 ${err.motivo}\n━━━━\n` }
 txt += `🔥 Errores: *${errores.length}*`
 }
 txt += `\n⏱️ ${((Date.now()-start)/1000).toFixed(2)}s`
 await sock.sendMessage(jid, { text: txt }, { quoted: m })
}
export default handler
