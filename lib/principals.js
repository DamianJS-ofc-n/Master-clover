import makeWASocket, {
 useMultiFileAuthState,
 DisconnectReason,
 fetchLatestBaileysVersion,
 makeCacheableSignalKeyStore,
 Browsers
} from '@whiskeysockets/baileys'
import pino from 'pino'
import fs from 'fs'
import path from 'path'

const principals = new Map()
const cleanNumber = (n='') => String(n).replace(/\D/g,'')
const sleep = ms => new Promise(r=>setTimeout(r,ms))

export function getPrincipalConfig(clean){
 let dir = path.join(process.cwd(), 'principals', clean)
 let file = path.join(dir, 'config.json')
 let def = {
 type: "principal"
 }
 if(!fs.existsSync(dir)) fs.mkdirSync(dir,{recursive:true})
 if(!fs.existsSync(file)){
 fs.writeFileSync(file, JSON.stringify(def,null,2));
 return def
 }
 try{
 let data = JSON.parse(fs.readFileSync(file,'utf8'));
 return {...def,...data}
 }catch{ return def }
}

export function savePrincipalConfig(clean, newData){
 let dir = path.join(process.cwd(), 'principals', clean)
 let file = path.join(dir, 'config.json')
 let current = getPrincipalConfig(clean)
 let merged = {...current,...newData}
 if(!fs.existsSync(dir)) fs.mkdirSync(dir,{recursive:true})
 fs.writeFileSync(file, JSON.stringify(merged,null,2))
 return merged
}

export async function createPrincipalBot(phone, hooks={}){
 const num = cleanNumber(phone)
 const dir = path.join(process.cwd(),'principals',num)
 if(!fs.existsSync(dir)) fs.mkdirSync(dir,{recursive:true})
 const pConfig = getPrincipalConfig(num)
 const { state, saveCreds } = await useMultiFileAuthState(dir)
 const { version } = await fetchLatestBaileysVersion()
 const sock = makeWASocket({
 version,
 auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({level:'silent'})) },
 logger: pino({level:'silent'}),
 browser: Browsers.ubuntu('Chrome'),
 printQRInTerminal: false,
 markOnlineOnConnect: true,
 syncFullHistory: false,
 keepAliveIntervalMs: 30000,
 })
 sock.isPrincipal = true
 sock.isSubBot = false
 sock.principalNumber = num
 sock.principalConfig = pConfig
 principals.set(num, { sock, phone: num, config: pConfig })
 sock.ev.on('creds.update', saveCreds)
 let codeSent=false
 const sendCode = async()=>{
 if(codeSent || state.creds.registered) return
 codeSent=true
 await sleep(2500)
 try{
 const code = await sock.requestPairingCode(num)
 const fmt = code?.match(/.{1,4}/g)?.join('-') || code
 if(hooks.onCode) hooks.onCode(fmt)
 }catch{ codeSent=false }
 }
 sock.ev.on('connection.update', async({connection,lastDisconnect})=>{
 if(!state.creds.registered) await sendCode()
 if(connection==='open'){
 console.log(`[PRINCIPAL] ${num} CONECTADO`)
 if(hooks.onConnected) hooks.onConnected(sock)
 }
 if(connection==='close'){
 let code = lastDisconnect?.error?.output?.statusCode
 if(code===DisconnectReason.loggedOut){
 try{ fs.rmSync(dir,{recursive:true,force:true}) }catch{}
 principals.delete(num)
 } else if(code!==DisconnectReason.connectionReplaced){
 setTimeout(()=>createPrincipalBot(num,hooks),5000)
 }
 }
 })
 sock.ev.on('messages.upsert', async(up)=>{
 if(up.type!=='notify') return
 try{
 const main = await import('../main.js')
 await main.handleMessages(sock, up)
 }catch(e){ console.log('[PRINCIPAL MSG]', e.message) }
 })
 return sock
}

export function getPrincipals(){ return principals }
export function getPrincipal(n){ return principals.get(cleanNumber(n)) }
export function removePrincipal(n){
 const num=cleanNumber(n)
 const data=principals.get(num)
 try{ data?.sock?.end?.() }catch{}
 principals.delete(num)
 try{ fs.rmSync(path.join(process.cwd(),'principals',num),{recursive:true,force:true}) }catch{}
}
export function loadAllPrincipals(){
 const root = path.join(process.cwd(),'principals')
 if(!fs.existsSync(root)) return
 for(let f of fs.readdirSync(root)){
 let full = path.join(root,f)
 try{ if(fs.statSync(full).isDirectory()) createPrincipalBot(f).catch(()=>{}) }catch{}
 }
}

setTimeout(()=>{
 try{
 const root = path.join(process.cwd(),'principals')
 if(!fs.existsSync(root)) return
 for(let f of fs.readdirSync(root)){
 let full = path.join(root,f)
 try{ if(fs.statSync(full).isDirectory()){
 if(!principals.has(f)) createPrincipalBot(f).catch(()=>{})
 }}catch{}
 }
 }catch{}
}, 4000)
