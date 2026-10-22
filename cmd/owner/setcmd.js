import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import config from '../../config.js'
import { isOwnerCheck } from '../../lib/isOwner.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const handler = {}
handler.name = 'setcmd'
handler.alias = ['setcmds','installcmd','updatecmd','rcmd']
handler.category = 'owner'
handler.owner = true

// unzip sin dependencias (solo STORE, que es como crea el.backup)
function unzip(buffer, outDir){
 let offset = 0
 let files = 0
 while(offset < buffer.length){
 if(buffer.readUInt32LE(offset)!== 0x04034b50) break
 const fileNameLen = buffer.readUInt16LE(offset+26)
 const extraLen = buffer.readUInt16LE(offset+28)
 const compSize = buffer.readUInt32LE(offset+18)
 const fileName = buffer.slice(offset+30, offset+30+fileNameLen).toString('utf8')
 const dataStart = offset+30+fileNameLen+extraLen
 const data = buffer.slice(dataStart, dataStart+compSize)

 // seguridad: no permitir../
 if(fileName.includes('..')){
 offset = dataStart+compSize
 continue
 }
 // si el zip viene con carpeta cmd/ adentro o directo
 let cleanName = fileName
 if(cleanName.startsWith('cmd/')) cleanName = cleanName.replace(/^cmd\//,'')
 if(cleanName.startsWith('/')) cleanName = cleanName.slice(1)
 if(!cleanName) { offset = dataStart+compSize; continue }

 const fullPath = path.join(outDir, cleanName)
 const dir = path.dirname(fullPath)
 if(!fs.existsSync(dir)) fs.mkdirSync(dir,{recursive:true})

 // si es carpeta (termina en /)
 if(fileName.endsWith('/')){
 if(!fs.existsSync(fullPath)) fs.mkdirSync(fullPath,{recursive:true})
 }else{
 fs.writeFileSync(fullPath, data)
 files++
 }
 offset = dataStart+compSize
 }
 return files
}

handler.exec = async (...args) => {
 let sock, m, a
 if (args[0]?.key) { m = args[0]; sock = args[1]?.conn || global.conn; a = args[1]?.args || [] }
 else { sock = args[0]; m = args[1]; a = args[2] || [] }

 const from = m.key.remoteJid
 const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage || m.message?.documentMessage || m.message?.documentWithCaptionMessage?.message?.documentMessage
 const doc = m.message?.documentMessage || m.message?.documentWithCaptionMessage?.message?.documentMessage || m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.documentMessage

 if(!doc){
 return sock.sendMessage(from,{text:`📦 *Instalar CMD nuevo*\n\n1. Mándame un.zip con todos los comandos\n2. Responde a ese zip con: ${config.prefix}setcmd\n\n⚠️ *Esto BORRA toda tu carpeta cmd/ actual y pone la nueva*\n\nSi tu zip tiene adentro la carpeta cmd/, la detecto sola.`},{quoted:m})
 }

 try{
 await sock.sendMessage(from,{text:`⏳ Descargando zip...`},{quoted:m})
 const buffer = await sock.downloadMediaMessage? await sock.downloadMediaMessage({message:{documentMessage:doc}}) : await global.conn.downloadMediaMessage? await global.conn.downloadMediaMessage(m) : null

 // fallback para tu base
 let buf = buffer
 if(!buf){
 const { default: baileys } = await import('@whiskeysockets/baileys')
 // intenta con el método global
 buf = await sock.downloadMediaMessage(m)
 }

 const baseDir = path.join(__dirname, '../..')
 const cmdDir = path.join(baseDir, 'cmd')

 // Backup de seguridad del cmd viejo por si la cagas
 const backupDir = path.join(baseDir, 'storage','temp',`cmd-backup-${Date.now()}`)
 if(!fs.existsSync(path.dirname(backupDir))) fs.mkdirSync(path.dirname(backupDir),{recursive:true})
 if(fs.existsSync(cmdDir)){
 fs.cpSync(cmdDir, backupDir, {recursive:true})
 }

 // Borrar cmd actual (menos owner para no borrarte el comando en uso? lo borramos todo igual)
 fs.rmSync(cmdDir, {recursive:true, force:true})
 fs.mkdirSync(cmdDir, {recursive:true})
 fs.mkdirSync(path.join(cmdDir,'owner'), {recursive:true})

 // Re-crear este archivo para no quedar sin setcmd
 const selfPath = path.join(cmdDir,'owner','setcmd.js')
 fs.writeFileSync(selfPath, fs.readFileSync(__filename))

 const count = unzip(buf, cmdDir)

 await sock.sendMessage(from,{text:`✅ *CMD Reemplazado*\n\n📁 Archivos instalados: ${count}\n🗑️ CMD viejo guardado en:\n${backupDir}\n\n🔄 Reinicia el bot para cargar los nuevos comandos.`},{quoted:m})

 }catch(e){
 return sock.sendMessage(from,{text:`❌ Error: ${e.message}\n${e.stack}`},{quoted:m})
 }
}
