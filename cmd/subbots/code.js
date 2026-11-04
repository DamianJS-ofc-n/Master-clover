import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, Browsers } from 'WhiskeySockets-locosyasociados'
import pino from 'pino'
import fs from 'fs'
import path from 'path'

export const handler = {}
handler.name = 'code'
handler.alias = ['serbot','jadibot','subbot','masters','codebot']
handler.category = 'jadi'

const clean = n => String(n||'').split('@')[0].split(':')[0].replace(/\D/g,'')

handler.exec = async (sock, m) => {
 const from = m.key?.remoteJid
 const isGroup = from?.endsWith('@g.us')
 const text = m.message?.conversation || m.message?.extendedTextMessage?.text || m.message?.imageMessage?.caption || ''
 const args = text.trim().split(/\s+/).slice(1)
 
 // PRIORIDAD: si escribe .code 549... usar eso, no detectar
 let target = args[0] ? clean(args[0]) : null

 // Solo si no pasó número, intentar detectar
 if(!target){
 let raw = ''
 if(isGroup) raw = m.key?.participant || m.key?.participantPn || ''
 else raw = m.key?.remoteJid || m.key?.remoteJidPn || m.key?.participant || ''

 // traducir LID si hace falta
 if(String(raw).includes('@lid')){
 try{
 let pn = await sock.signalRepository?.lidMapping?.getPNForLID?.(raw)
 if(pn) target = clean(pn)
 }catch{}
 } else {
 target = clean(raw)
 }
 }

 if(!target || target.length < 10 || target.length > 15 || target.startsWith('1408') || /^\d{16,}$/.test(target)){
 return sock.sendMessage(from, { text: `❌ Usa manual, tu WhatsApp está en modo LID y no puedo leer tu número.\n\nEjemplo:\n.code 5492645746772\n\n(Sin + , sin espacios)` }, { quoted: m })
 }

 const subPath = path.join(process.cwd(),'subbots',target)
 try{
 if(fs.existsSync(path.join(subPath,'creds.json'))){
 let j = JSON.parse(fs.readFileSync(path.join(subPath,'creds.json'),'utf-8'))
 if(!j.registered){
 fs.rmSync(subPath,{recursive:true,force:true})
 }
 }
 }catch{}
 if(!fs.existsSync(subPath)) fs.mkdirSync(subPath,{recursive:true})

 const caption = `ㅤ ロ⃝ ❀ \`Sub-Bots masters\` 
ᗤᗤ *Conecta un Sub-bot para el número » ${target}*

 🥷 *Pasos de vinculación*

⚔️ 1️⃣*Abre WhatsApp en tu teléfono » Ve a Ajustes/Configuración*

⚔️ 2️⃣ *Entra en Dispositivos vinculados* 

⚔️ 3️⃣ *Pulsa Vincular un dispositivo y Selecciona Vincular con número de teléfono*

⚔️ 4️⃣ *Pega el código que te dió el bot hay.*

> Este código expira en 60 segundos`

 await sock.sendMessage(from, { text: `⏳ Generando para ${target}...` }, { quoted: m })

 try{
 const { state, saveCreds } = await useMultiFileAuthState(subPath)
 if(state.creds.registered){
 return sock.sendMessage(from, { text:`✅ ${target} ya está vinculado` }, { quoted: m })
 }
 const { version } = await fetchLatestBaileysVersion()
 const subSock = makeWASocket({
 version,
 auth:{ creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({level:'silent'})) },
 logger: pino({level:'silent'}),
 browser: Browsers.ubuntu('Chrome'),
 printQRInTerminal:false,
 markOnlineOnConnect:false,
 })
 subSock.ev.on('creds.update', saveCreds)

 const code = await subSock.requestPairingCode(target)
 const fmt = code?.match(/.{1,4}/g)?.join('-') || code

 await sock.sendMessage(from, { text: caption }, { quoted: m })
 await new Promise(r=>setTimeout(r,500))
 await sock.sendMessage(from, { text: `${fmt}` }, { quoted: m })

 subSock.ev.on('connection.update', async u=>{
 if(u.connection==='open'){
 await sock.sendMessage(from, { text:`✅ Sub-bot ${target} conectado!` }, { quoted: m })
 try{ const main=await import('../../main.js'); subSock.ev.on('messages.upsert', up=> main.handleMessages(subSock, up)) }catch{}
 }
 })

 }catch(e){
 console.log('[CODE ERR]', e)
 // Connection Closed = rate limit, borrar para reintentar
 if(String(e.message).includes('Connection Closed')){
 try{ fs.rmSync(subPath,{recursive:true,force:true}) }catch{}
 return sock.sendMessage(from, { text:`❌ WhatsApp cerró la conexión (rate limit).\n\nEsperá 2-3 minutos y volvé a usar:\n.code ${target}\n\nNo spamees el comando.` }, { quoted: m })
 }
 try{ fs.rmSync(subPath,{recursive:true,force:true}) }catch{}
 await sock.sendMessage(from, { text:`❌ Error: ${e.message}` }, { quoted: m })
 }
}
