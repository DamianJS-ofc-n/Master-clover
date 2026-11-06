import fs from 'fs'
import path from 'path'
import { getSubs } from '../../lib/jadi.js'
import { getPrincipals } from '../../lib/principals.js'
import config from '../../config.js'

export const handler = {}
handler.name = 'reloadsubs'
handler.alias = ['recargar', 'reload', 'revivir', 'revivirsubs']
handler.category = 'subbots'

const DB_PATH = path.join(process.cwd(), 'db', 'reloadsubs.json')
const timers = new Map()
let timerId = 0

function getOwners(){
 return (config?.bot?.owner || []).map(n => String(n).split('@')[0].replace(/\D/g,'')).filter(Boolean)
}
function senderCanon(m){
 let raw = m.key?.participantPn || m.key?.participant || m.key?.remoteJid || ''
 return String(raw).split('@')[0].split(':')[0].replace(/\D/g,'')
}
function loadDB(){
 try{
 if(!fs.existsSync(DB_PATH)) return { loops: [] }
 let d = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))
 if(!Array.isArray(d.loops)) d.loops = []
 return d
 }catch{ return { loops: [] } }
}
function saveDB(){
 try{
 if(!fs.existsSync(path.dirname(DB_PATH))) fs.mkdirSync(path.dirname(DB_PATH), {recursive:true})
 let loops = []
 for(let [id, t] of timers) loops.push({ id, target: t.target, ms: t.ms, label: t.label, jid: t.jid, count: t.count, createdAt: t.createdAt || Date.now() })
 fs.writeFileSync(DB_PATH, JSON.stringify({ loops, updatedAt: Date.now() }, null, 2))
 }catch(e){ console.log('[RELOAD DB]', e.message) }
}
function removeFromDB(id){
 try{
 let db = loadDB()
 db.loops = db.loops.filter(l => l.id !== id)
 fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
 }catch{}
}
function parseTime(args){
 let joined = args.join(' ').toLowerCase().trim()
 if(!joined) return null
 let m = joined.match(/(\d+)\s*(s|seg|segs|segundo|segundos|m|min|mins|minuto|minutos|h|hora|horas|d|dia|dias)\b/)
 if(!m){
 let solo = joined.match(/^(\d+)$/)
 if(solo && solo[1].length <= 4) m = [solo[0], solo[1], 'm']
 else return null
 }
 if(m[1].length > 4) return null
 let n = parseInt(m[1]); let u = m[2] || 'm'; let ms = 0
 if(['s','seg','segs','segundo','segundos'].includes(u)) ms = n * 1000
 else if(['m','min','mins','minuto','minutos'].includes(u)) ms = n * 60 * 1000
 else if(['h','hora','horas'].includes(u)) ms = n * 60 * 60 * 1000
 else if(['d','dia','dias'].includes(u)) ms = n * 24 * 60 * 60 * 1000
 else ms = n * 60 * 1000
 if(ms < 10000) ms = 10000
 return { ms, n, u, label: `${n} ${u}` }
}
function formatMs(ms){
 if(ms < 60000) return `${Math.round(ms/1000)}s`
 if(ms < 3600000) return `${Math.round(ms/60000)}m`
 if(ms < 86400000) return `${(ms/3600000).toFixed(1)}h`
 return `${(ms/86400000).toFixed(1)}d`
}

// ===== FIX: ya no llama al default como si fuera funcion =====
async function tryCreate(num, isPri){
 const jadi = await import('../../lib/jadi.js')
 const princ = await import('../../lib/principals.js')
 const mod = isPri ? princ : jadi
 let fns = []
 let add = (name, fn) => { if(typeof fn === 'function') fns.push([name, fn]) }
 if(isPri){
 add('createPrincipalBot', mod.createPrincipalBot)
 add('createPrincipal', mod.createPrincipal)
 add('createBot', mod.createBot)
 } else {
 add('createJadiBot', mod.createJadiBot)
 add('createSubBot', mod.createSubBot)
 add('createBot', mod.createBot)
 add('createJadi', mod.createJadi)
 add('createSub', mod.createSub)
 }
 if(mod.default && typeof mod.default === 'object'){
 for(let k of Object.keys(mod.default)) add(`default.${k}`, mod.default[k])
 } else if(typeof mod.default === 'function'){
 add('default', mod.default)
 }
 if(!fns.length) throw new Error(`No hay funcion para crear ${isPri ? 'principal' : 'sub'} en lib/${isPri ? 'principals' : 'jadi'}.js - exports: ${Object.keys(mod).join(', ')} | default keys: ${mod.default && typeof mod.default === 'object' ? Object.keys(mod.default).join(', ') : typeof mod.default}`)
 let errores = []
 for(let [name, fn] of fns){
 try{
 let r = await fn(num)
 return { ok: true, fn: name, result: r }
 }catch(e){ errores.push(`${name}: ${e.message || e}`) }
 }
 throw new Error(errores.join(' | '))
}

async function doReload(sock, jid, target){
 let revividos = 0, fallidos = 0, intentados = [], errores = []
 try{
 const subDir = path.join(process.cwd(), 'subbots')
 const priDir = path.join(process.cwd(), 'principals')
 const numsSub = fs.existsSync(subDir) ? fs.readdirSync(subDir).filter(f => /^\d+$/.test(f)) : []
 const numsPri = fs.existsSync(priDir) ? fs.readdirSync(priDir).filter(f => /^\d+$/.test(f)) : []
 let isOne = target && /^\d{7,15}$/.test(target)
 let isAll = target === 'all'
 let aSub = isOne ? numsSub.filter(n => n === target) : numsSub
 let aPri = isOne ? numsPri.filter(n => n === target) : numsPri
 const miNum = sock.principalNumber || sock.subNumber || sock?.user?.id?.split(':')[0]?.replace(/\D/g,'') || ''
 let matar = isOne || isAll
 for(let num of aSub){
 if(matar){
 try{
 const cur = getSubs().get(num)
 const s = cur?.sock || cur
 if(s){ s._misticManualClose = true; try{ s.end?.() }catch{}; try{ s.ws?.close?.() }catch{} }
 getSubs().delete(num)
 }catch{}
 intentados.push({num, pri:false})
 } else {
 const cur = getSubs().get(num)
 const s = cur?.sock || cur
 if(s?.user && s?.ws?.isOpen) continue
 intentados.push({num, pri:false})
 }
 }
 for(let num of aPri){
 if(num === miNum && !isOne && !isAll) continue
 if(matar){
 try{
 const cur = getPrincipals().get(num)
 if(cur?.sock){ cur.sock._misticManualClose = true; try{ cur.sock.end?.() }catch{}; try{ cur.sock.ws?.close?.() }catch{} }
 getPrincipals().delete(num)
 }catch{}
 intentados.push({num, pri:true})
 } else {
 const cur = getPrincipals().get(num)
 if(cur?.sock?.user && cur.sock.ws?.isOpen) continue
 intentados.push({num, pri:true})
 }
 }
 for(let it of intentados){
 try{
 await tryCreate(it.num, it.pri)
 revividos++
 }catch(e){
 fallidos++
 errores.push(`${it.num}: ${e.message}`)
 console.log(`[RELOAD FAIL] ${it.num}`, e.message)
 }
 await new Promise(r => setTimeout(r, 1500))
 }
 return { revividos, fallidos, intentados: intentados.map(i=>i.num), errores }
 }catch(e){
 console.log('[RELOAD ERROR]', e)
 return { revividos, fallidos, intentados: [], errores: [e.message] }
 }
}

function createLoop(sock, jid, target, time){
 timerId++
 let id = timerId
 let label = target ? `para ${target}` : 'para los muertos'
 let info = { timer: null, target: target || 'muertos', ms: time.ms, label, jid, count: 0, createdAt: Date.now() }
 let run = async () => {
 info.count++; saveDB()
 try{
 await sock.sendMessage(jid, { text: `🔄 Loop #${info.count} - Reviviendo ${label}...` })
 let r = await doReload(sock, jid, target)
 let errTxt = r.errores.length ? `\n\n❌ Errores:\n${r.errores.slice(0,3).join('\n')}` : ''
 await sock.sendMessage(jid, { text: `✅ Loop #${info.count} listo\n\n🔄 Intentados: ${r.intentados.length}\n✅ Revividos: ${r.revividos}\n❌ Fallidos: ${r.fallidos}${errTxt}\n⏳ Próxima en ${formatMs(time.ms)} - Para parar: *.reloadsubs cancel*` })
 }catch(e){
 try{ await sock.sendMessage(jid, { text: `❌ Error en loop #${info.count}: ${e.message}` }) }catch{}
 }
 }
 info.timer = setInterval(run, time.ms)
 timers.set(id, info)
 saveDB()
 return { id, info }
}

export async function restoreReloadLoops(sock){
 let db = loadDB()
 if(!db.loops.length) return 0
 let restaurados = 0
 for(let l of db.loops){
 if(timers.has(l.id)) continue
 let dup = [...timers.values()].some(t => t.target === l.target && t.jid === l.jid)
 if(dup) continue
 let info = { timer: null, target: l.target, ms: l.ms, label: l.label, jid: l.jid, count: l.count || 0, createdAt: l.createdAt || Date.now() }
 let run = async () => {
 info.count++; saveDB()
 try{
 await sock.sendMessage(l.jid, { text: `🔄 Loop #${info.count} (restaurado) - Reviviendo ${l.label}...` })
 let r = await doReload(sock, l.jid, l.target === 'muertos' ? null : l.target)
 let errTxt = r.errores.length ? `\n\n❌ Errores:\n${r.errores.slice(0,3).join('\n')}` : ''
 await sock.sendMessage(l.jid, { text: `✅ Loop #${info.count} listo\n\n🔄 Intentados: ${r.intentados.length}\n✅ Revividos: ${r.revividos}\n❌ Fallidos: ${r.fallidos}${errTxt}\n⏳ Próxima en ${formatMs(l.ms)} - Para parar: *.reloadsubs cancel*` })
 }catch(e){ console.log('[RELOAD RESTORE]', e.message) }
 }
 info.timer = setInterval(run, l.ms)
 timers.set(l.id, info)
 if(l.id > timerId) timerId = l.id
 restaurados++
 try{ await sock.sendMessage(l.jid, { text: `♻️ Loop restaurado después del reinicio\n🔁 ${l.label} cada ${formatMs(l.ms)} | Vueltas anteriores: ${l.count || 0}\nPara parar: *.reloadsubs cancel*` }) }catch{}
 }
 saveDB()
 console.log(`[RELOAD] Restaurados ${restaurados} loops desde DB`)
 return restaurados
}

handler.exec = async (sock, m, args) => {
 const jid = m.key.remoteJid
 const sender = senderCanon(m)
 const owners = getOwners()
 if(owners.length && !owners.includes(sender) && !m.isOwner){
 return sock.sendMessage(jid, { text: '❌ Solo owner puede recargar los subs' }, { quoted: m })
 }
 if(!timers.size){
 let db = loadDB()
 if(db.loops.length) await restoreReloadLoops(sock)
 }
 if(args[0]?.toLowerCase() === 'debug'){
 const jadi = await import('../../lib/jadi.js')
 const princ = await import('../../lib/principals.js')
 const subDir = path.join(process.cwd(), 'subbots')
 const numsSub = fs.existsSync(subDir) ? fs.readdirSync(subDir) : []
 return sock.sendMessage(jid, { text: `🔍 *DEBUG RELOAD*\n\n📁 subbots/ carpetas: ${numsSub.join(', ') || 'VACIO'}\n📦 jadi.js exports: ${Object.keys(jadi).join(', ')}\n📦 principals.js exports: ${Object.keys(princ).join(', ')}\n🧠 En memoria subs: ${getSubs().size}\n🧠 En memoria principals: ${getPrincipals().size}\n\nSi subbots/ está vacío, no hay nada que revivir, por eso da 0.` }, { quoted: m })
 }
 if(args[0]?.toLowerCase() === 'cancel' || args[0]?.toLowerCase() === 'cancelar' || args[0]?.toLowerCase() === 'stop'){
 let n = 0
 for(let [id, t] of timers){ clearInterval(t.timer); timers.delete(id); removeFromDB(id); n++ }
 try{ fs.writeFileSync(DB_PATH, JSON.stringify({ loops: [], updatedAt: Date.now() }, null, 2)) }catch{}
 if(!n) return sock.sendMessage(jid, { text: `ℹ️ No había ningún loop activo` }, { quoted: m })
 return sock.sendMessage(jid, { text: `🛑 Loop cancelado\nSe detuvieron ${n} recarga(s)` }, { quoted: m })
 }
 if(args[0]?.toLowerCase() === 'list' || args[0]?.toLowerCase() === 'lista'){
 if(!timers.size){
 let db = loadDB()
 if(!db.loops.length) return sock.sendMessage(jid, { text: `ℹ️ No hay loops activos` }, { quoted: m })
 }
 let txt = `🔁 *LOOPS ACTIVOS: ${timers.size}*\n\n`
 for(let [id, t] of timers) txt += `🆔 ${id} | ${t.label} | cada ${formatMs(t.ms)} | vueltas: ${t.count}\n`
 txt += `\nPara parar: *.reloadsubs cancel*`
 return sock.sendMessage(jid, { text: txt }, { quoted: m })
 }
 let target = null
 let restArgs = [...args]
 for(let i = 0; i < restArgs.length; i++){
 let clean = String(restArgs[i]).replace(/\D/g,'')
 if(/^\d{7,15}$/.test(clean)){ target = clean; restArgs.splice(i, 1); break }
 }
 if(!target && restArgs[0]?.toLowerCase() === 'all'){ target = 'all'; restArgs.splice(0, 1) }
 let time = parseTime(restArgs)
 if(!time){
 await sock.sendMessage(jid, { text: '🔄 Recargando subbots ahora... (una sola vez)' }, { quoted: m })
 let r = await doReload(sock, jid, target)
 let errTxt = r.errores.length ? `\n\n❌ *Errores reales:*\n${r.errores.join('\n')}` : ''
 return sock.sendMessage(jid, { text: `✅ Recarga lista\n\n🔄 Intentados: ${r.intentados.length}\n✅ Revividos: ${r.revividos}\n❌ Fallidos: ${r.fallidos}${errTxt}` }, { quoted: m })
 }
 for(let [id, t] of timers){
 if(t.target === (target || 'muertos') && t.jid === jid){ clearInterval(t.timer); timers.delete(id); removeFromDB(id) }
 }
 let { id } = createLoop(sock, jid, target, time)
 let label = target ? `para ${target}` : 'para los muertos'
 await sock.sendMessage(jid, { text: `🔁 *LOOP ACTIVADO* ${label}\n\n⏳ Cada: ${formatMs(time.ms)} (${time.label})\n🆔 ID: ${id}\n💾 Guardado en DB, sobrevive al reinicio\n🔄 Se va a repetir solo hasta que pongas *.reloadsubs cancel*` }, { quoted: m })
}
export default handler
