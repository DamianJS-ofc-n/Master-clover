import fs from 'fs'
import os from 'os'
import path from 'path'
import { spawn } from 'child_process'

function buildAbortSignal(ms) { if (typeof AbortSignal?.timeout === 'function') return AbortSignal.timeout(ms); const ctrl = new AbortController(); setTimeout(()=>ctrl.abort(), ms); return ctrl.signal }
function runFfmpeg(args, timeoutMs = 60_000) {
 return new Promise((resolve, reject) => {
 const proc = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] })
 let stderr=''; const timer=setTimeout(()=>{ try{proc.kill('SIGKILL')}catch{} reject(new Error('ffmpeg timeout')) }, timeoutMs)
 proc.stderr.on('data', d=>stderr+=d.toString())
 proc.on('close', code=>{ clearTimeout(timer); code===0?resolve(true):reject(new Error(stderr||`ffmpeg ${code}`)) })
 })
}

export const handler = {}
handler.name = 'hd'
handler.alias = ['enhance','remini']
handler.category = 'utils'

handler.exec = async (sock, m) => {
 let jid = m.key.remoteJid
 const ctx = m.message?.extendedTextMessage?.contextInfo
 const quotedMsg = ctx?.quotedMessage
 const quotedStanzaId = ctx?.stanzaId
 const quotedParticipant = ctx?.participant

 let msgToDownload = null
 if (quotedMsg?.imageMessage) {
 msgToDownload = { key: { remoteJid: jid, id: quotedStanzaId, fromMe: false, participant: quotedParticipant }, message: quotedMsg }
 } else if (m.message?.imageMessage) {
 msgToDownload = m
 } else {
 return sock.sendMessage(jid, { text: `《✧》 Responde a una *imagen* con.hd` }, { quoted: m })
 }

 try {
 let downloadMediaMessage
 try { ({ downloadMediaMessage } = await import('baileys')) } catch { ({ downloadMediaMessage } = await import('@whiskeysockets/baileys')) }

 await sock.sendMessage(jid, { react: { text:'🕒', key: m.key } })
 const buffer = await downloadMediaMessage(msgToDownload, 'buffer', {}, { logger: console, reuploadRequest: sock.updateMediaMessage })
 if (!buffer) throw new Error('buffer vacio')

 const API='https://us-central1-vector-ink.cloudfunctions.net/upscaleImage'
 const res = await fetch(API, { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify({ data:{ image: buffer.toString('base64') } }), signal: buildAbortSignal(120000) })
 const j = await res.json().catch(()=>null)
 if (!j?.result) throw new Error('API fallo')

 const inner = JSON.parse(j.result)
 const webpBuf = Buffer.from(inner.image.b64_json, 'base64')
 const tmpDir = path.join(os.tmpdir(),'vectorink')
 if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir,{recursive:true})
 const tag=`${Date.now()}_${Math.random().toString(16).slice(2)}`
 const inPath=path.join(tmpDir,`vi_in_${tag}.webp`)
 const outPath=path.join(tmpDir,`vi_out_${tag}.png`)
 fs.writeFileSync(inPath, webpBuf)
 await runFfmpeg(['-y','-i',inPath,'-frames:v','1',outPath],60000)
 const png = fs.readFileSync(outPath)
 fs.unlinkSync(inPath); fs.unlinkSync(outPath)

 await sock.sendMessage(jid, { image: png }, { quoted: m })
 await sock.sendMessage(jid, { react: { text:'✔️', key: m.key } })
 } catch(e) {
 console.log('[HD]', e)
 await sock.sendMessage(jid, { react: { text:'✖️', key: m.key } })
 await sock.sendMessage(jid, { text:`《✧》 Error: ${e.message}` }, { quoted: m })
 }
}
