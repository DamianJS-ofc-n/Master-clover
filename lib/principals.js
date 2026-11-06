import makeWASocket, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, fetchLatestWaWebVersion, makeCacheableSignalKeyStore, Browsers, jidDecode } from 'WhiskeySockets-locosyasociados'
import pino from 'pino'
import fs from 'fs'
import path from 'path'
import NodeCache from 'node-cache'

const logger = pino({ level: 'silent' })
const msgRetryCounterCache = new NodeCache({ stdTTL: 0, checkperiod: 0 })
const userDevicesCache = new NodeCache({ stdTTL: 0, checkperiod: 0 })

const principals = new Map()
const pendingPairingCodes = new Map()
const pendingPairingCleanup = new Map()
const pairingCodeRequests = new Map()
const sleep = ms => new Promise(r=>setTimeout(r,ms))
const cleanNumber = (n='') => String(n).replace(/\D/g,'')
const isValidBotNumber = (n='') => /^\d{7,15}$/.test(cleanNumber(n)) && !/^0+$/.test(cleanNumber(n))

export function getPrincipalConfig(clean){
 clean = cleanNumber(clean)
 let dir = path.join(process.cwd(), 'principals', clean)
 let file = path.join(dir, 'config.json')
 let def = { type: "principal", name: `MASTER CLOVER`, banner: "https://raw.githubusercontent.com/starlyn-chann/Mistic-star/main/tourl/1791658575065-D6ufbDFJC7Mv.jpg", theme: "normal", prefix: "." }
 if(!fs.existsSync(dir)) fs.mkdirSync(dir,{recursive:true})
 if(!fs.existsSync(file)){ fs.writeFileSync(file, JSON.stringify(def,null,2)); return def }
 try{ return {...def,...JSON.parse(fs.readFileSync(file,'utf8'))} }catch{ return def }
}
export function savePrincipalConfig(clean, newData){
 clean = cleanNumber(clean)
 let dir = path.join(process.cwd(), 'principals', clean)
 let file = path.join(dir, 'config.json')
 let merged = {...getPrincipalConfig(clean),...newData}
 if(!fs.existsSync(dir)) fs.mkdirSync(dir,{recursive:true})
 fs.writeFileSync(file, JSON.stringify(merged,null,2))
 return merged
}

function safeEnd(sock){ try{ if(!sock) return; sock._misticManualClose = true; sock?.end?.() }catch{} }
function clearPending(clean){
 const t = pendingPairingCleanup.get(clean)
 if(t) clearTimeout(t)
 pendingPairingCleanup.delete(clean)
 pendingPairingCodes.delete(clean)
}
function cleanupUnregistered(clean, sock, dir, reason){
 const cur = principals.get(clean)
 const curSock = cur?.sock || sock
 if(curSock?.authState?.creds?.registered) return false
 if(curSock) safeEnd(curSock)
 if(sock && sock !== curSock) safeEnd(sock)
 principals.delete(clean)
 clearPending(clean)
 if(reason) console.log(`[PRINCIPAL ${clean}] Limpieza: ${reason}`)
 return true
}
function schedulePairingCleanup(clean, sock, dir, code){
 clearPending(clean)
 pendingPairingCodes.set(clean, { code, expiresAt: Date.now()+60000 })
 const timer = setTimeout(()=>{
 const curSock = principals.get(clean)?.sock || sock
 if(curSock?.authState?.creds?.registered){ clearPending(clean); return }
 cleanupUnregistered(clean, curSock, dir, 'pairing no completado')
 }, 90000)
 pendingPairingCleanup.set(clean, timer)
}

async function getWaVersion(){
 try{
 const r = await Promise.allSettled([
 typeof fetchLatestWaWebVersion === 'function' ? fetchLatestWaWebVersion() : Promise.reject(new Error('no fn')),
 typeof fetchLatestBaileysVersion === 'function' ? fetchLatestBaileysVersion() : Promise.reject(new Error('no fn'))
 ])
 const vs = r.filter(x=>x.status==='fulfilled' && x.value?.version).map(x=>x.value.version)
 if(!vs.length) return [2,3000,1043857760]
 return vs.sort((a,b)=>b[2]-a[2])[0]
 }catch{ return [2,3000,1043857760] }
}

export async function createPrincipalBot(phone, hooks={}){
 const num = cleanNumber(phone)
 if(!isValidBotNumber(num)) throw new Error(`Número inválido: ${num}`)
 const dir = path.join(process.cwd(),'principals',num)
 const existing = principals.get(num)
 if(existing?.sock?.authState?.creds?.registered && existing.sock.user) return existing.sock
 if(existing?.sock){
 safeEnd(existing.sock)
 principals.delete(num)
 clearPending(num)
 }
 if(!fs.existsSync(dir)) fs.mkdirSync(dir,{recursive:true})
 const pConfig = getPrincipalConfig(num)
 const { state, saveCreds } = await useMultiFileAuthState(dir)
 const version = await getWaVersion()
 console.log(`[PRINCIPAL ${num}] Creando socket, version:`, version)

 const sock = makeWASocket({ version, auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, logger) }, logger, browser: Browsers.windows('Chrome'), printQRInTerminal: false, markOnlineOnConnect: false, syncFullHistory: false, keepAliveIntervalMs: 30000, connectTimeoutMs: 60000, defaultQueryTimeoutMs: 60000, msgRetryCounterCache, userDevicesCache })
 sock.authState = state
 sock.isPrincipal = true; sock.isSubBot = false; sock.principalNumber = num; sock.principalConfig = pConfig; sock.subConfig = pConfig
 sock.decodeJid = (jid) => { if(!jid) return jid; if(/:\d+@/gi.test(jid)){ const d = jidDecode(jid)||{}; return (d.user && d.server && d.user+'@'+d.server)||jid } return jid }
 principals.set(num, { sock, phone: num, config: pConfig, uptime: Date.now() })
 sock.ev.on('creds.update', saveCreds)

 sock.ev.on('connection.update', async({connection, lastDisconnect})=>{
 const code = lastDisconnect?.error?.output?.statusCode || 0
 console.log(`[PRINCIPAL ${num}] connection.update:`, connection, 'code:', code)
 if(connection==='open'){
 console.log(`[PRINCIPAL] ${num} CONECTADO`)
 clearPending(num)
 if(hooks.onConnected) hooks.onConnected(sock)
 }
 if(connection==='close'){
 if(sock._misticManualClose) return
 if([401,403,DisconnectReason.loggedOut].includes(code)){
 try{ fs.rmSync(dir,{recursive:true,force:true}) }catch{}
 principals.delete(num)
 clearPending(num)
 if(hooks.onClose) hooks.onClose('sesión cerrada')
 return
 }
 if(!state.creds.registered) return
 setTimeout(()=>{ createPrincipalBot(num, hooks).catch(()=>{}) }, 10000)
 }
 })

 sock.ev.on('messages.upsert', async(up)=>{
 if(up.type!=='notify') return
 try{ const main = await import('../main.js'); await main.handleMessages(sock, up) }catch(e){ console.log('[PRINCIPAL MSG]', e.message) }
 })
 return sock
}

export function getPairingCode(number, userConfig = {}){
 const clean = cleanNumber(number)
 if(!isValidBotNumber(clean)) throw new Error(`Número inválido: ${clean}`)
 const dir = path.join(process.cwd(),'principals',clean)
 const pending = pendingPairingCodes.get(clean)
 if(pending && pending.expiresAt > Date.now() && pendingPairingCleanup.has(clean)){
 return Promise.resolve({ status: 'pending', code: pending.code, number: clean })
 }
 if(pending) cleanupUnregistered(clean, principals.get(clean)?.sock, dir, 'código vencido')
 const active = pairingCodeRequests.get(clean)
 if(active && active.then) return active
 const request = (async()=>{
 try{ return await requestPairingAttempt(clean, userConfig) }
 catch(err){ cleanupUnregistered(clean, principals.get(clean)?.sock, dir, 'error pairing'); throw err }
 })()
 pairingCodeRequests.set(clean, request)
 return request.finally(()=>{ if(pairingCodeRequests.get(clean)===request) pairingCodeRequests.delete(clean) })
}

async function requestPairingAttempt(clean, userConfig={}){
 const dir = path.join(process.cwd(),'principals',clean)
 if(!fs.existsSync(dir)) fs.mkdirSync(dir,{recursive:true})
 return new Promise(async(resolve, reject)=>{
 let resolved=false, sock=null, timeout=null
 const finish=(data,isError=false)=>{ if(resolved) return; resolved=true; if(timeout) clearTimeout(timeout); isError?reject(data):resolve(data) }
 timeout=setTimeout(()=>{ console.log(`[PRINCIPAL ${clean}] TIMEOUT 60s, ws.isOpen:`, sock?.ws?.isOpen); cleanupUnregistered(clean, sock, dir, 'tiempo agotado'); finish({status:'timeout', code:null, number:clean}) }, 60000)

 try{
 sock = await createPrincipalBot(clean, {
 onConnected: ()=> finish({status:'connected', code:null, number:clean}),
 onCode: (code)=> finish({status:'pending', code, number:clean}),
 onError: (msg)=>{ cleanupUnregistered(clean, sock, dir, msg); finish(new Error(msg), true) }
 })
 if(sock?.authState?.creds?.registered) return finish({status:'connected', code:null, number:clean})

 // UN SOLO LUGAR PIDE EL CODIGO, con reintentos, sin waitForSocketOpen que se colgaba
 for(let intento=1; intento<=3; intento++){
 if(resolved) return
 if(sock.authState?.creds?.registered) return finish({status:'connected', code:null, number:clean})
 console.log(`[PRINCIPAL ${clean}] Intento ${intento}/3 pedir codigo, ws.isOpen:`, sock.ws?.isOpen)
 // esperar a que el ws abra, con polling, no con waitForSocketOpen
 for(let i=0;i<10;i++){
 if(sock.ws?.isOpen) break
 await sleep(500)
 }
 if(!sock.ws?.isOpen){
 console.log(`[PRINCIPAL ${clean}] ws no abrió en intento ${intento}`)
 await sleep(2000)
 continue
 }
 try{
 await sleep(1000)
 const raw = await sock.requestPairingCode(clean)
 console.log(`[PRINCIPAL ${clean}] requestPairingCode OK:`, raw)
 const fmt = String(raw).replace(/-/g,'').match(/.{1,4}/g)?.join('-') || raw
 schedulePairingCleanup(clean, sock, dir, fmt)
 return finish({status:'pending', code:fmt, number:clean})
 }catch(e){
 console.log(`[PRINCIPAL ${clean}] Error intento ${intento}:`, e.message)
 if(intento===3) throw e
 await sleep(2000)
 }
 }
 throw new Error('No se pudo pedir codigo despues de 3 intentos')
 }catch(e){ console.log(`[PRINCIPAL ${clean}] requestPairingAttempt error:`, e.message); cleanupUnregistered(clean, sock, dir, `error: ${e?.message}`); finish(e, true) }
 })
}

export function waitForPrincipalConnection(number, timeoutMs=180000){
 const clean = cleanNumber(number)
 return new Promise((resolve)=>{
 let done=false, timer=null, interval=null
 const finish=(v)=>{ if(done) return; done=true; if(timer) clearTimeout(timer); if(interval) clearInterval(interval); resolve(v) }
 interval=setInterval(()=>{ const cur=principals.get(clean)?.sock; if(cur?.authState?.creds?.registered && cur?.user) return finish(true); if(!cur && !pendingPairingCleanup.has(clean)) finish(false) },1000)
 timer=setTimeout(()=>finish(false), timeoutMs)
 })
}

export function getPrincipals(){ return principals }
export function getPrincipal(n){ return principals.get(cleanNumber(n)) }
export function removePrincipal(n){ const num=cleanNumber(n); const data=principals.get(num); try{ data?.sock?.end?.() }catch{}; principals.delete(num); clearPending(num); try{ fs.rmSync(path.join(process.cwd(),'principals',num),{recursive:true,force:true}) }catch{} }
export function loadAllPrincipals(){ const root = path.join(process.cwd(),'principals'); if(!fs.existsSync(root)) return; for(let f of fs.readdirSync(root)){ try{ if(fs.statSync(path.join(root,f)).isDirectory()) createPrincipalBot(f).catch(()=>{}) }catch{} } }
