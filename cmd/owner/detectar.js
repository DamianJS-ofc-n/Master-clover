import { isOwnerCheck } from '../../lib/isOwner.js'
import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'

export const handler = {}
handler.name = 'detectar'
handler.alias = ['scan', 'corrupcion']
handler.category = 'owner'
handler.description = 'Escanea corrupción de plugins'

handler.exec = async (sock, m) => {
 const jid = m.key.remoteJid
 const start = Date.now()
 
 await sock.sendMessage(jid, { text: `⚔️ *ESCANEANDO- BOT\n\n⏳ Analizando...` }, { quoted: m })

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
 try {
 await import(pathToFileURL(path.resolve(file)).href + `?t=${Date.now()}`)
 } catch (e) {
 errores.push({
 archivo: path.basename(file),
 motivo: e.message.split('\n')[0].slice(0, 200)
 })
 }
 }

 let txt = `⛔ *Escaneo de Corrupción* 🎋\n\n「 𝘌𝘭 Bot 𝘪𝘯𝘪𝘤𝘪𝘢 𝘦𝘭 𝘢𝘯𝘢́𝘭𝘪𝘴𝘪𝘴 」\n\n📂 *Plugins detectados:* ${files.length}\n━━━━━━━━━━━━━━━━━━━\n\n`

 if (errores.length === 0) {
 txt += `✅ *Sistema limpio*\nSin corrupción detectada.`
 } else {
 for (let err of errores) {
 txt += `⚠️ *Corrupción detectada*\n📁 Archivo: *${err.archivo}*\n👾 Motivo: *${err.motivo}*\n━━━━━━━━━━━━━━━━━━━\n\n`
 }
 txt += `🔥 *Resumen*\n❌ Errores totales: *${errores.length}*\n📂 Archivos analizados: *${files.length}*\n💣 El bot exige corregir los archivos marcados.`
 }

 txt += `\n⏱️ ${((Date.now()-start)/1000).toFixed(2)}s`

 await sock.sendMessage(jid, { text: txt }, { quoted: m })
}
