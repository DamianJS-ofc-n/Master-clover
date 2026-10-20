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

const subs = new Map()
const cleanNumber = (n = '') => String(n).replace(/\D/g, '')
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
function safeEnd(sock) { try { sock?.end?.() } catch {} }
function safeRemoveDir(dir) { try { if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true }) } catch {} }

export function getSubConfig(clean){
 let dir = path.join(process.cwd(), 'jadiBots', clean)
 let file = path.join(dir, 'config.json')
 let def = {
 name: `Master cløver 🍀`,
 banner: "https://raw.githubusercontent.com/starlyn-chann/Mistic-star/main/tourl/1791658575065-D6ufbDFJC7Mv.jpg",
 theme: "normal"
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
export function saveSubConfig(clean, newData){
 let dir = path.join(process.cwd(), 'jadiBots', clean)
 let file = path.join(dir, 'config.json')
 let current = getSubConfig(clean)
 let merged = {...current,...newData}
 if(!fs.existsSync(dir)) fs.mkdirSync(dir,{recursive:true})
 fs.writeFileSync(file, JSON.stringify(merged,null,2))
 return merged
}

export async function createJadiBot(mainSock, m, phone, handleCommand, esReconexion = false, hooks = {}) {
 const clean = cleanNumber(phone)
 const jadiPath = path.join(process.cwd(), 'jadiBots', clean)
 const existing = subs.get(clean)
 if (existing?.sock?.user &&!esReconexion) return existing.sock
 if (!fs.existsSync(jadiPath)) fs.mkdirSync(jadiPath, { recursive: true })
 if(!esReconexion) getSubConfig(clean)

 const { state, saveCreds } = await useMultiFileAuthState(jadiPath)
 const { version } = await fetchLatestBaileysVersion()
 const sock = makeWASocket({
 version,
 auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })) },
 logger: pino({ level: 'silent' }),
 browser: Browsers.ubuntu('Chrome'),
 printQRInTerminal: false,
 markOnlineOnConnect: false,
 syncFullHistory: false,
 keepAliveIntervalMs: 30000,
 connectTimeoutMs: 60000,
 defaultQueryTimeoutMs: 60000
 })
 sock.isSubBot = true
 sock.subNumber = clean
 sock.subConfig = getSubConfig(clean)
 subs.set(clean, { sock, phone: clean, config: sock.subConfig, uptime: Date.now(), prefixes: [sock.subConfig.prefix || '.'] })
 sock.ev.on('creds.update', async () => { try { await saveCreds() } catch {} })

 let codigoPedido = false, reconectando = false
 const pedirCodigo = async () => {
 if (codigoPedido || sock.authState.creds.registered) return
 codigoPedido = true
 try{
 await sleep(3000)
 if (sock.authState.creds.registered) return
 const code = await sock.requestPairingCode(clean)
 const fmt = code?.match(/.{1,4}/g)?.join('-') || code
 if (hooks.onCode) await hooks.onCode(fmt)
 }catch(err){ codigoPedido=false; if (hooks.onError) await hooks.onError(`No se pudo generar el código: ${err?.message}`) }
 }
 sock.ev.on('connection.update', async (update) => {
 const { connection, lastDisconnect } = update
 if (!codigoPedido &&!sock.authState.creds.registered) await pedirCodigo()
 if (connection === 'open'){ reconectando=false; if (hooks.onConnected) await hooks.onConnected(sock); return }
 if (connection === 'close'){
 const statusCode = lastDisconnect?.error?.output?.statusCode
 if (statusCode === DisconnectReason.loggedOut || statusCode === 401 || statusCode === 403){ safeEnd(sock); subs.delete(clean); safeRemoveDir(jadiPath); if (hooks.onClose) await hooks.onClose('sesión cerrada'); return }
 if (statusCode === DisconnectReason.connectionReplaced || statusCode === 440){ safeEnd(sock); subs.delete(clean); if (hooks.onClose) await hooks.onClose('conexión reemplazada'); return }
 if (reconectando) return; reconectando=true
 const delay = (statusCode === 515)? 1500 : 5000
 setTimeout(async () => {
 try{ const current = subs.get(clean); if (current?.sock) safeEnd(current.sock); subs.delete(clean); await createJadiBot(mainSock, m, clean, handleCommand, true, hooks) }catch{ reconectando=false }
 }, delay)
 }
 })
 sock.ev.on('messages.upsert', async (up) => {
 if (up.type!== 'notify') return; const msg = up.messages?.[0]; if (!msg?.message) return; if (msg.key?.remoteJid === 'status@broadcast') return
 try{ const main = await import('../main.js'); await main.handleMessages(sock, up) }catch{}
 })
 return sock
}
export function getSubs() { return subs }
export function getSub(number) { return subs.get(cleanNumber(number)) }
export function removeSub(number) { const clean = cleanNumber(number); const data = subs.get(clean); if (data?.sock) safeEnd(data.sock); subs.delete(clean); safeRemoveDir(path.join(process.cwd(), 'jadiBots', clean)) }
export function getConnectionStatus() { const arr = Array.from(subs.values()); const active = arr.filter(s => s.sock?.user).length; return { total: subs.size, active } }