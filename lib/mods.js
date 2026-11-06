import fs from 'fs'
import path from 'path'
import config from '../config.js'

export const MODS_FILE = path.join(process.cwd(), 'Mods.json')

export const RANGOS = [
 { min: 0, nombre: '🛡️ 𝙋𝙍𝙄𝙉𝘾𝙄𝙋𝙄𝘼𝙉𝙏𝙀' },
 { min: 5, nombre: '⭐ 𝙀𝙉𝘾𝘼𝙍𝙂𝘼𝘿𝙊' },
 { min: 17, nombre: '♦️ 𝙎𝙐𝙋𝙀𝙍 𝘼𝘿𝙈𝙄𝙉' },
 { min: 18, nombre: '🛠️ 𝙎𝙐𝙋𝙋𝙊𝙍𝙏' },
 { min: 27, nombre: '☘️ 𝘼𝙎𝙄𝙎𝙏𝙀𝙉𝙏𝙀 𝙇𝙑𝙇 1' },
 { min: 508, nombre: '🏮 𝙎𝙐𝘽-𝙊𝙒𝙉𝙀𝙍' },
 { min: 1357, nombre: '👑 𝙊𝙒𝙉𝙀𝙍' },
]

export function getRango(stars){
 let r = RANGOS[0]
 for(let x of RANGOS){ if(stars >= x.min) r = x }
 return r
}
export function getNextRango(stars){
 for(let x of RANGOS){ if(stars < x.min) return x }
 return null
}
export function loadMods(){
 try{ if(!fs.existsSync(MODS_FILE)) return {}
 return JSON.parse(fs.readFileSync(MODS_FILE,'utf8'))
 }catch{ return {} }
}
export function saveMods(db){
 fs.writeFileSync(MODS_FILE, JSON.stringify(db, null, 2))
}
export function cleanNum(n=''){ return String(n).replace(/\D/g,'') }
export const clean = cleanNum

export function getOwners(){
 return (config?.bot?.owner||[]).map(n=>n.toString().split('@')[0].replace(/\D/g,'')).filter(Boolean)
}
export function isOwner(m){
 let raw = m.key?.participant || m.key?.remoteJid || ''
 let c = raw.split('@')[0].split(':')[0].replace(/\D/g,'')
 if(m.key?.fromMe) return true
 return getOwners().includes(c)
}
export function isMod(m){
 if(isOwner(m)) return true
 let raw = m.key?.participant || m.key?.remoteJid || ''
 let c = raw.split('@')[0].split(':')[0].replace(/\D/g,'')
 let db = loadMods()
 return !!db[c] && db[c].rol === 'staff'
}
export function getNumeroManual(a){
 let found = (a||[]).find(x => /^\d{7,15}$/.test(x) || x.includes('@s.whatsapp.net'))
 if(!found) return null
 return cleanNum(found)
}

// --- PARA delrol / otros que usan getTarget ---
export async function lidToPn(lid, sock) {
 let jid = String(lid)
 if (!jid.includes('@')) jid = jid + '@lid'
 try {
 let pn = await sock.signalRepository?.lidMapping?.getPNForLID?.(jid)
 if (pn) return cleanNum(pn)
 } catch {}
 return null
}

export async function getTarget(m, sock, args = []) {
 const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.message?.extendedTextMessage?.contextInfo?.participant
 if (mentioned) {
 let raw = String(mentioned)
 if (raw.includes('@lid')) {
 let pn = await lidToPn(raw, sock)
 if (pn) return pn + '@s.whatsapp.net'
 }
 if (raw.includes('@')) return raw
 return cleanNum(raw) + '@s.whatsapp.net'
 }
 const quotedParticipant = m.message?.extendedTextMessage?.contextInfo?.participant
 if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage && quotedParticipant) {
 let raw = String(quotedParticipant)
 if (raw.includes('@lid')) {
 let pn = await lidToPn(raw, sock)
 if (pn) return pn + '@s.whatsapp.net'
 }
 return raw
 }
 if (args[0]) {
 let n = cleanNum(args[0])
 if (n.length >= 8 && n.length <= 15) return n + '@s.whatsapp.net'
 }
 let raw = String(m.sender || m.key?.remoteJid || '')
 if (raw.includes('@lid')) {
 let pn = await lidToPn(raw, sock)
 if (pn) return pn + '@s.whatsapp.net'
 }
 return cleanNum(raw) + '@s.whatsapp.net'
}

export async function getNumber(m, sock, args = []) {
 const target = await getTarget(m, sock, args)
 return cleanNum(target)
}
