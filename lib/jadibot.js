import makeWASocket, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, Browsers } from '@whiskeysockets/baileys'
import pino from 'pino'
import fs from 'fs'
import path from 'path'

export async function createJadiBot(mainSock, m, phone, handleCommand) {
 const jadiPath = path.join('./jadiBots', phone)
 if (fs.existsSync(jadiPath)) fs.rmSync(jadiPath, { recursive: true, force: true })
 fs.mkdirSync(jadiPath, { recursive: true })

 const { state, saveCreds } = await useMultiFileAuthState(jadiPath)
 const { version } = await fetchLatestBaileysVersion()

 const sock = makeWASocket({
 version,
 auth: {
 creds: state.creds,
 keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
 },
 logger: pino({ level: 'silent' }),
 browser: Browsers.macOS('Desktop'),
 printQRInTerminal: false,
 keepAliveIntervalMs: 10000,
 connectTimeoutMs: 60000,
 defaultQueryTimeoutMs: 0
 })

 sock.ev.on('creds.update', saveCreds)

 // FIX PARA INICIANDO SESION INFINITO
 let asked = false
 sock.ev.on('connection.update', async (up) => {
 const { connection } = up

 if (!asked) {
 asked = true
 await new Promise(r => setTimeout(r, 2500))
 try {
 if (!sock.authState.creds.registered) {
 let code = await sock.requestPairingCode(phone)
 let formatted = code.match(/.{1,4}/g)?.join('-') || code
 await mainSock.sendMessage(m.key.remoteJid, { text: `*TU CÓDIGO: ${formatted}*\n\nSi se queda en "Iniciando sesión" esperá 30s sin tocar nada. No le des atrás.` }, { quoted: m })
 console.log(`CODE ${phone}: ${formatted}`)
 }
 } catch (e) {
 console.log(e)
 }
 }

 if (connection === 'open') {
 console.log(`CONECTADO ${phone}`)
 await mainSock.sendMessage(m.key.remoteJid, { text: `✅ +${phone} CONECTADO` }, { quoted: m })
 sock.ev.on('messages.upsert', async ({ messages }) => {
 if (handleCommand) await handleCommand(sock, messages[0])
 })
 }
 })

 // Que nunca se cierre solo mientras espera el código
 sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
 if (connection === 'close') {
 let code = lastDisconnect?.error?.output?.statusCode
 console.log(`Close ${phone}: ${code}`)
 // NO borrar si es 408 o timeout, que es cuando se queda iniciando
 if (code === DisconnectReason.loggedOut) {
 fs.rmSync(jadiPath, { recursive: true, force: true })
 }
 }
 })
}
