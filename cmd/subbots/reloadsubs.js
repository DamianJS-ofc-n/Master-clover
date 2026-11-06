import fs from 'fs'
import path from 'path'
import { getSubs } from '../../lib/jadi.js'
import { getPrincipals } from '../../lib/principals.js'
import config from '../../config.js'

export const handler = {}
handler.name = 'reloadsubs'
handler.alias = ['recargar', 'reload', 'revivir', 'revivirsubs']
handler.category = 'subbots'

const timers = new Map()
let timerId = 0

function getOwners(){
 return (config?.bot?.owner || []).map(n => String(n).split('@')[0].replace(/\D/g,'')).filter(Boolean)
}

// .reloadsubs 14 m | 1 h | 30 s | 2 d | 14m | 1h
// .reloadsubs 5492645746772 14 m
function parseTime(args){
 // buscar numero + unidad en los args
 // acepta: ["14","m"] o ["14m"] o ["1","h"]
 let joined = args.join(' ').toLowerCase().trim()
 let m = joined.match(/(\d+)\s*(s|seg|segs|segundo|segundos|m|min|mins|minuto|minutos|h|hora|horas|d|dia|dias)?/)
 if(!m) return null
 // si solo vino un numero de telefono largo, no es tiempo
 if(m[1].length > 4) return null
 let n = parseInt(m[1])
 let u = m[2] || 'm'
 let ms = 0
 if(['s','seg','segs','segundo','segundos'].includes(u)) ms = n * 1000
 else if(['m','min','mins','minuto','minutos'].includes(u)) ms = n * 60 * 1000
 else if(['h','hora','horas'].includes(u)) ms = n * 60 * 60 * 1000
 else if(['d','dia','dias'].includes(u)) ms = n * 24 * 60 * 60 * 1000
 else ms = n * 60 * 1000
 return { ms, n, u, label: `${n} ${u}` }
}

function formatMs(ms){
 if(ms < 60000) return `${Math.round(ms/1000)}s`
 if(ms < 3600000) return `${Math.round(ms/60000)}m`
 if(ms < 86400000) return `${(ms/3600000).toFixed(1)}h`
 return `${(ms/86400000).toFixed(1)}d`
}

async function doReload(sock, jid, target, mode){
 let revividos = 0, fallidos = 0, intentados = []
 try{
 const jadi = await import('../../lib/jadi.js')
 const princ = await import('../../lib/principals.js')
 const createJadi = jadi.createJadiBot || jadi.createSubBot || jadi.createBot
 const createPrincipal = princ.createPrincipalBot

 const subDir = path.join(process.cwd(), 'subbots')
 const priDir = path.join(process.cwd(), 'principals')
 const numsSub = fs.existsSync(subDir) ? fs.readdirSync(subDir).filter(f => /^\d+$/.test(f)) : []
 const numsPri = fs.existsSync(priDir) ? fs.readdirSync(priDir).filter(f => /^\d+$/.test(f)) : []

 let aSub = numsSub, aPri = numsPri
 if(target && /^\d{7,15}$/.test(target)){
 aSub = numsSub.filter(n => n === target)
 aPri = numsPri.filter(n => n === target)
 } else if(target === 'all'){
 // todos
 } else if(target){
 // si target no es numero ni all, es modo, no filtrar
 }

 const miNum = sock.principalNumber || sock.subNumber || sock?.user?.id?.split(':')[0]?.replace(/\D/g,'') || ''

 // matar viejos solo si es all o un numero especifico
 const matar = (target && target !== 'muertos') || mode === 'all' || !!target
 for(let num of aSub){
 if(matar){
 try{
 const cur = getSubs().get(num)
 const s = cur?.sock || cur
 if(s){ s._misticManualClose = true; try{ s.end?.() }catch{}; try{ s.ws?.close?.() }catch{} }
 getSubs().delete(num)
 }catch{}
 } else {
 const cur = getSubs().get(num)
 const s = cur?.sock || cur
 if(s?.user && s?.ws?.isOpen) continue
 }
 intentados.push(num)
 }
 for(let num of aPri){
 if(num === miNum && !target) continue
 if(matar){
 try{
 const cur = getPrincipals().get(num)
 if(cur?.sock){ cur.sock._misticManualClose = true; try{ cur.sock.end?.() }catch{}; try{ cur.sock.ws?.close?.() }catch{} }
 getPrincipals().delete(num)
 }catch{}
 } else {
 const cur = getPrincipals().get(num)
 if(cur?.sock?.user && cur.sock.ws?.isOpen) continue
 }
 intentados.push(num)
 }

 for(let num of aSub){
 if(!intentados.includes(num) && target !== 'all' && !/^\d{7,15}$/.test(target || '')) continue
 // si es modo muertos, solo los de intentados
 if(!target && !intentados.includes(num)) continue
 try{ await createJadi(num); revividos++ }catch(e){ console.log(`[RELOAD] sub ${num}`, e.message); fallidos++ }
 await new Promise(r => setTimeout(r, 1500))
 }
 for(let num of aPri){
 if(num === miNum && !target) continue
 if(!intentados.includes(num)) continue
 try{ await createPrincipal(num); revividos++ }catch(e){ console.log(`[RELOAD] pri ${num}`, e.message); fallidos++ }
 await new Promise(r => setTimeout(r, 1500))
 }
 return { revividos, fallidos, intentados }
 }catch(e){
 console.log('[RELOAD ERROR]', e)
 return { revividos, fallidos, intentados, error: e.message }
 }
}

handler.exec = async (sock, m, args) => {
 const jid = m.key.remoteJid
 const sender = (m.key.participant || m.key.remoteJid || '').split('@')[0].replace(/\D/g,'')
 const owners = getOwners()
 if(owners.length && !owners.includes(sender) && !m.isOwner){
 return sock.sendMessage(jid, { text: '❌ Solo owner puede recargar los subs' }, { quoted: m })
 }

 // .reloadsubs cancel -> cancela el timer
 if(args[0]?.toLowerCase() === 'cancel' || args[0]?.toLowerCase() === 'cancelar'){
 let n = 0
 for(let [id, t] of timers){ clearTimeout(t); timers.delete(id); n++ }
 return sock.sendMessage(jid, { text: `🛑 Se cancelaron ${n} recargas programadas` }, { quoted: m })
 }

 // detectar numero de telefono si viene
 let target = null
 let restArgs = [...args]
 for(let i = 0; i < restArgs.length; i++){
 let clean = String(restArgs[i]).replace(/\D/g,'')
 if(/^\d{7,15}$/.test(clean)){
 target = clean
 restArgs.splice(i, 1)
 break
 }
 }
 if(!target && restArgs[0]?.toLowerCase() === 'all'){
 target = 'all'
 restArgs.splice(0, 1)
 }

 // detectar tiempo
 let time = parseTime(restArgs)
 // si no puso tiempo, es ahora mismo
 if(!time){
 // .reloadsubs -> ahora, solo muertos
 // .reloadsubs all -> ahora, todos
 // .reloadsubs 549... -> ahora, ese
 await sock.sendMessage(jid, { text: '🔄 Recargando subbots ahora...' }, { quoted: m })
 let r = await doReload(sock, jid, target, target === 'all' ? 'all' : 'muertos')
 return sock.sendMessage(jid, { text: `✅ Recarga lista\n\n🔄 Intentados: ${r.intentados.length}\n✅ Revividos: ${r.revividos}\n❌ Fallidos: ${r.fallidos}` }, { quoted: m })
 }

 // CON TIEMPO -> programar, no recargar ahora
 timerId++
 let id = timerId
 let label = target ? `para ${target}` : 'para todos los subs'
 await sock.sendMessage(jid, { text: `⏰ Recarga programada ${label}\n\n⏳ En: ${formatMs(time.ms)} (${time.label})\n🆔 ID: ${id}\n\nPara cancelar: .reloadsubs cancel` }, { quoted: m })

 let timer = setTimeout(async () => {
 timers.delete(id)
 try{
 await sock.sendMessage(jid, { text: `🔄 Llegó el tiempo, recargando ${label}...` })
 let r = await doReload(sock, jid, target, target ? 'all' : 'muertos')
 await sock.sendMessage(jid, { text: `✅ Recarga programada lista\n\n🔄 Intentados: ${r.intentados.length}\n✅ Revividos: ${r.revividos}\n❌ Fallidos: ${r.fallidos}` })
 }catch(e){
 await sock.sendMessage(jid, { text: `❌ Error en recarga programada: ${e.message}` })
 }
 }, time.ms)

 timers.set(id, timer)
}
export default handler
