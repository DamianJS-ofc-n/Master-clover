import config from '../../config.js'
import fs from 'fs'
import path from 'path'

export const handler = {}
handler.name = 'savefile'
handler.alias = ['guardar', 'save', 'creararchivo']
handler.category = 'owner'
handler.owner = true

function getOwners(){return (config?.bot?.owner||[]).map(n=>n.toString().split('@')[0].replace(/\D/g,'')).filter(Boolean)}
function isOwnerDirect(m){let raw=m.key?.participant||m.key?.remoteJid||'';let clean=raw.split('@')[0].split(':')[0].replace(/\D/g,'');if(m.key?.fromMe)return true;return getOwners().includes(clean)||config.bot.owner.includes(raw)}

// sacar el texto del mensaje citado, soporta todas las formas que usa Baileys
function getQuotedText(m){
 // forma 1: m.quoted (algunos handlers lo ponen asi)
 if(m.quoted?.text) return m.quoted.text
 if(typeof m.quoted === 'string' && m.quoted) return m.quoted
 // forma 2: contextInfo de Baileys
 let ctx = m.message?.extendedTextMessage?.contextInfo || m.message?.imageMessage?.contextInfo || m.message?.videoMessage?.contextInfo || m.message?.documentMessage?.contextInfo
 let q = ctx?.quotedMessage
 if(q){
 return q.conversation || q.extendedTextMessage?.text || q.imageMessage?.caption || q.videoMessage?.caption || q.documentMessage?.caption || ''
 }
 // forma 3: m.quotedMessage
 if(m.quotedMessage) return m.quotedMessage.conversation || m.quotedMessage.extendedTextMessage?.text || ''
 // forma 4: m.msg.contextInfo
 let ctx2 = m.msg?.contextInfo
 let q2 = ctx2?.quotedMessage
 if(q2) return q2.conversation || q2.extendedTextMessage?.text || ''
 return ''
}

function cleanCode(txt){
 if(!txt) return ''
 let t = txt.trim()
 // si viene con ```js ... ``` sacarlo
 if(t.startsWith('```')){
 t = t.replace(/^```[a-zA-Z]*\n?/, '').replace(/```\s*$/, '').trim()
 }
 return t
}

handler.exec = async (...args) => {
 let sock, m, a
 if (args[0]?.key) { m = args[0]; sock = args[1]?.conn || global.conn; a = args[1]?.args || [] }
 else { sock = args[0]; m = args[1]; a = args[2] || [] }
 if(!isOwnerDirect(m)) return await sock.sendMessage(m.key.remoteJid, { text: '⚠️ Solo owners pueden usar esto.' }, { quoted: m })
 let jid = m.key.remoteJid

 // el primer arg tiene que ser la ruta
 let ruta = a[0]
 // si el comando vino como ".savefile cmd/grupo/kick.js" pero tu handler te pasa el texto completo, sacarlo del texto
 if(!ruta){
 let full = m.message?.extendedTextMessage?.text || m.message?.conversation || m.text || ''
 let parts = full.trim().split(/\s+/)
 // parts[0] es .savefile, parts[1] es la ruta
 if(parts.length > 1) ruta = parts[1]
 }
 if(!ruta){
 return await sock.sendMessage(jid, { text: `🍁 Responde a un mensaje con .savefile \neje: savefile cmd/grupo/kick.js` }, { quoted: m })
 }

 // seguridad: no dejar salir de la carpeta del bot, ni pisar cosas sensibles
 if(ruta.includes('..') || path.isAbsolute(ruta)) return await sock.sendMessage(jid, { text: `❌ Ruta no permitida.` }, { quoted: m })
 let bloqueados = ['.env', 'config.js', 'db/github.json', 'package.json', 'package-lock.json']
 if(bloqueados.includes(ruta) || bloqueados.some(b => ruta.endsWith(b))) return await sock.sendMessage(jid, { text: `❌ No podes pisar ${ruta} con savefile.` }, { quoted: m })

 // el codigo puede venir citado, o en el mismo mensaje despues de la ruta
 let code = cleanCode(getQuotedText(m))
 if(!code){
 // si no citaron, ver si despues de la ruta mandaron el codigo en el mismo mensaje
 let full = m.message?.extendedTextMessage?.text || m.message?.conversation || m.text || ''
 let idx = full.indexOf(ruta)
 if(idx !== -1){
 let resto = full.slice(idx + ruta.length).trim()
 if(resto) code = cleanCode(resto)
 }
 }
 if(!code){
 return await sock.sendMessage(jid, { text: `🍁 Responde a un mensaje con .savefile \neje: savefile cmd/grupo/kick.js` }, { quoted: m })
 }

 let fullPath = path.join(process.cwd(), ruta)
 let existia = fs.existsSync(fullPath)
 try{
 fs.mkdirSync(path.dirname(fullPath), { recursive: true })
 fs.writeFileSync(fullPath, code)
 let stat = fs.statSync(fullPath)
 let hora = new Date().toLocaleTimeString('es-AR', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })
 if(existia){
 await sock.sendMessage(jid, { text: `❀ *Archivo actualizado*\n\n📁 *Nombre:* ${ruta}\n🍃*Tamaño:* ${stat.size} bytes\n🍃*Modificado:* ${hora}` }, { quoted: m })
 } else {
 await sock.sendMessage(jid, { text: `❀ *Archivo creado*\n\n📁 *Nombre:* ${ruta}\n🍃*Tamaño:* ${stat.size} bytes\n🍃*Modificado:* ${hora}` }, { quoted: m })
 }
 }catch(e){
 await sock.sendMessage(jid, { text: `❌ Error al guardar: ${e.message}` }, { quoted: m })
 }
}
export default handler
