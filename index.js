import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  Browsers,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys'
import pino from 'pino'
import { start, handleMessages, loadPlugins } from './main.js'
import readline from 'readline'
import fs from 'fs'
import path from 'path'
import qrcode from 'qrcode-terminal'
import { createJadiBot, waitForSubConnection, removeSub } from './lib/jadi.js'

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (t) => new Promise(r => rl.question(t, r))

const c = {
  reset: '\x1b[0m',
  rojo: '\x1b[31m',
  azul: '\x1b[34m',
  verdeNeon: '\x1b[38;5;46m',
  naranja: '\x1b[38;5;208m',
  morado: '\x1b[38;5;141m',
  verde: '\x1b[32m',
  celeste: '\x1b[36m',
  pink: '\x1b[38;5;218m',
  pinkDim: '\x1b[38;5;212m',
  yellow: '\x1b[33m',
  blanco: '\x1b[97m',
  bold: '\x1b[1m'
}

console.clear()
// --- BANNER MASTER CLOVER CON COLORES ---
console.log(`${c.rojo}${c.bold}  ███╗   ███╗ █████╗ ███████╗████████╗███████╗██████╗ ${c.reset}`)
console.log(`${c.naranja}${c.bold}  ████╗ ████║██╔══██╗██╔════╝╚══██╔══╝██╔════╝██╔══██╗${c.reset}`)
console.log(`${c.verdeNeon}${c.bold}  ██╔████╔██║███████║███████╗   ██║   █████╗  ██████╔╝${c.reset}`)
console.log(`${c.azul}${c.bold}  ██║╚██╔╝██║██╔══██║╚════██║   ██║   ██╔══╝  ██╔══██╗${c.reset}`)
console.log(`${c.rojo}${c.bold}  ██║ ╚═╝ ██║██║  ██║███████║   ██║   ███████╗██║  ██║${c.reset}`)
console.log(`${c.naranja}${c.bold}  ╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝${c.reset}`)
console.log(`${c.verdeNeon}  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`)
console.log(`${c.blanco}${c.bold}  🍀 MASTER CLOVER - Powered by 𐚁ᴅᴀᴍɪᴀɴᴊs-ᴏғᴄ${c.reset}\n`)

function normalizePhone(input) {
  let s = String(input || '').replace(/\D/g, '')
  if (!s) return ''
  if (s.startsWith('0')) s = s.replace(/^0+/, '')
  if (s.length === 10 && s.startsWith('3')) s = '57' + s
  if (s.startsWith('52') && !s.startsWith('521') && s.length >= 12) s = '521' + s.slice(2)
  if (s.startsWith('54') && !s.startsWith('549') && s.length >= 11) s = '549' + s.slice(2)
  return s
}

if (fs.existsSync('./session/creds.json') && !fs.existsSync('./session/main1/creds.json')) {
  console.log(`${c.yellow}📦 Migrando sesión...${c.reset}`)
  if (!fs.existsSync('./session/main1')) fs.mkdirSync('./session/main1', { recursive: true })
  for (const f of fs.readdirSync('./session')) {
    const p = `./session/${f}`
    if (fs.statSync(p).isFile()) fs.copyFileSync(p, `./session/main1/${f}`)
  }
}

let opcion = null
let phoneNumber = ''
const methodCodeQR = process.argv.includes('--qr')
const methodCode = process.argv.includes('code')

let pairingRequested = false
let pairingCodeShown = false
let waitingPairing = false
let botStarted = false
let reconnectTimer = null

async function pedirMetodo() {
  let argPhone =
    process.argv[3] ||
    process.argv.find(a => /^\d{10,15}$/.test(String(a).replace(/\D/g, ''))) ||
    ''
  if (argPhone === 'code') argPhone = process.argv[3] || ''

  if (methodCodeQR) {
    opcion = '1'
    return
  }

  if (methodCode && argPhone) {
    const norm = normalizePhone(argPhone)
    if (norm.length >= 10) {
      opcion = '2'
      phoneNumber = norm
      console.log(`${c.pink}📱 Número detectado: ${phoneNumber}${c.reset}`)
      return
    }
  }

  if (fs.existsSync('./session/main1/creds.json')) {
    try {
      const creds = JSON.parse(fs.readFileSync('./session/main1/creds.json', 'utf8'))
      if (creds?.registered) return
    } catch {}
  }

  console.log(`${c.pink}┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓${c.reset}`)
  console.log(`${c.pink}┃ ${c.bold}${c.blanco} VINCULACIÓN · MASTER CLOVER ${c.pink}┃${c.reset}`)
  console.log(`${c.pink}┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛${c.reset}`)
  console.log(`${c.pinkDim} Selecciona un método${c.reset}\n`)
  console.log(`${c.blanco} ${c.pink}❰1❱${c.reset} ${c.blanco}Código QR${c.reset}`)
  console.log(`${c.blanco} ${c.pink}❰2❱${c.reset} ${c.blanco}Código de 8 dígitos${c.reset}\n`)
  console.log(`${c.pinkDim} Ingresa solo 1 o 2 para continuar${c.reset}`)
  opcion = (await question(`${c.pink}${c.bold} ❯ ${c.reset}`)).trim()
  while (!/^[1-2]$/.test(opcion)) {
    console.log(`${c.pink} ✖ Solo se permiten 1 o 2.${c.reset}`)
    opcion = (await question(`${c.pink}${c.bold} ❯ ${c.reset}`)).trim()
  }

  if (opcion === '2') {
    console.log(`\n${c.pink}📱 Pon tu numero de teléfono aquí${c.reset}`)
    console.log(`${c.pinkDim} Ejemplo: +54911xxxxxxx  (con código de país)${c.reset}\n`)
    const input = await question(`${c.pink}${c.bold} ❯ ${c.reset}`)
    phoneNumber = normalizePhone(input)
    while (!phoneNumber || phoneNumber.length < 10) {
      console.log(`${c.yellow} ✖ Número no válido, ponlo de nuevo.${c.reset}`)
      const input2 = await question(`${c.pink}${c.bold} ❯ ${c.reset}`)
      phoneNumber = normalizePhone(input2)
    }
    console.log(`${c.verde} ✓ Número: ${phoneNumber}${c.reset}`)
  }
}

async function requestCodeOnce(sock) {
  if (pairingRequested || pairingCodeShown) return
  if (sock.authState?.creds?.registered) return
  if (opcion !== '2' || !phoneNumber) return

  pairingRequested = true
  waitingPairing = true

  try {
    console.log(`\n${c.pink} Generando código para ${phoneNumber}...${c.reset}`)
    await new Promise(r => setTimeout(r, 1500))

    if (sock.authState?.creds?.registered) {
      waitingPairing = false
      return
    }

    const code = await sock.requestPairingCode(phoneNumber)
    const pretty = code?.match(/.{1,4}/g)?.join('-') || code
    pairingCodeShown = true

    console.log(`\n${c.pink}${c.bold} ╔════════════════════════════════╗`)
    console.log(` ║  ${c.blanco}CÓDIGO: ${pretty}${c.pink}  ║`)
    console.log(` ╚════════════════════════════════╝${c.reset}`)
    console.log(`${c.pinkDim} En el teléfono:`)
    console.log(`  WhatsApp → Dispositivos vinculados`)
    console.log(`  → Vincular dispositivo → Vincular con número de teléfono`)
    console.log(`  → Escribe el código de arriba.${c.reset}\n`)
    console.log(`${c.yellow} ⚠ No cierres esta terminal. Espera a que diga CONECTADO.${c.reset}\n`)
  } catch (e) {
    pairingRequested = false
    console.log(`${c.yellow} ✖ Error al pedir código: ${e.message}${c.reset}`)
    console.log(`${c.pinkDim} Reintentando en 5s...${c.reset}`)
    setTimeout(() => requestCodeOnce(sock), 5000)
  }
}

async function reconectarSubbots(sockPrincipal, m = null) {
  const dirSubbots = path.join(process.cwd(), 'subbots')
  const dirJadi = path.join(process.cwd(), 'jadiBots')

  const carpetas = []
  if (fs.existsSync(dirSubbots)) carpetas.push(...fs.readdirSync(dirSubbots).map(f => path.join(dirSubbots, f)))
  if (fs.existsSync(dirJadi)) carpetas.push(...fs.readdirSync(dirJadi).map(f => path.join(dirJadi, f)))

  if (carpetas.length === 0) return

  console.log(`\n${c.celeste}🔄 Buscando sub-bots para reconectar...${c.reset}`)

  for (const carpeta of carpetas) {
    try {
      if (!fs.statSync(carpeta).isDirectory()) continue
      
      const numero = path.basename(carpeta)
      const credsPath = path.join(carpeta, 'creds.json')

      if (fs.existsSync(credsPath)) {
        console.log(`${c.pinkDim} ↻ Reconectando sub-bot: ${numero}...${c.reset}`)
        
        await createJadiBot(sockPrincipal, m, numero, null, true)
        
        const conectado = await waitForSubConnection(numero, 45000)
        
        if (conectado) {
          console.log(`${c.verde} ✅ Sub-bot ${numero} reconectado y escuchando comandos.${c.reset}`)
        } else {
          console.log(`${c.yellow} ⚠️ Sub-bot ${numero} no pudo reconectar (sesión inválida o tiempo agotado).${c.reset}`)
          console.log(`${c.yellow} 🗑️ Eliminando sesión corrupta de ${numero}...${c.reset}`)
          removeSub(numero)
        }
        
        await new Promise(r => setTimeout(r, 1500))
      }
    } catch (e) {
      console.log(`${c.yellow} ⚠️ Error crítico reconectando ${path.basename(carpeta)}: ${e.message}${c.reset}`)
      removeSub(path.basename(carpeta))
    }
  }
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./session/main1')
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: Browsers.ubuntu('Chrome'),
    markOnlineOnConnect: false,
    syncFullHistory: false,
    keepAliveIntervalMs: 30000,
    mobile: false
  })

  sock.ev.on('creds.update', saveCreds)

  if (!state.creds?.registered && opcion === '2' && phoneNumber) {
    const tryRequest = () => requestCodeOnce(sock)
    setTimeout(tryRequest, 2000)
  }

  sock.ev.on('connection.update', async (update) => {
    const { qr, connection, lastDisconnect } = update

    if (qr && opcion === '1') {
      console.log(`${c.pink}${c.bold} ✿ Escanea este código QR${c.reset}\n`)
      qrcode.generate(qr, { small: true })
    }

    if (
      connection === 'connecting' &&
      opcion === '2' &&
      phoneNumber &&
      !sock.authState?.creds?.registered
    ) {
      requestCodeOnce(sock)
    }

    if (connection === 'open') {
      waitingPairing = false
      pairingRequested = true
      pairingCodeShown = true
      console.log(`\n${c.verdeNeon}${c.bold} ★ CONECTADO COMO MASTER CLOVER ★${c.reset}`)
      console.log(`${c.verdeNeon} 🍃 Core cargado${c.reset}`)
      console.log(`${c.naranja} 🍁 Lib cargada${c.reset}`)
      console.log(`${c.azul} 🚀 XD Bot listo${c.reset}\n`)
      try {
        rl.close()
      } catch {}
      if (!botStarted) {
        botStarted = true
        await start()
        await loadPlugins()
        setInterval(() => {
          if (fs.existsSync('./tmp')) {
            for (const f of fs.readdirSync('./tmp')) {
              try {
                fs.unlinkSync(`./tmp/${f}`)
              } catch {}
            }
          }
        }, 1000 * 60 * 60)
      }
      
      await reconectarSubbots(sock)
    }

    if (connection === 'close') {
      const status = lastDisconnect?.error?.output?.statusCode
      const loggedOut = status === DisconnectReason.loggedOut

      if (waitingPairing && !loggedOut && !sock.authState?.creds?.registered) {
        console.log(`${c.pinkDim} Esperando vinculación… no reinicio el proceso.${c.reset}`)
        if (reconnectTimer) clearTimeout(reconnectTimer)
        reconnectTimer = setTimeout(() => {
          if (!fs.existsSync('./session/main1/creds.json')) {
            if (!pairingCodeShown) pairingRequested = false
            startBot()
          } else {
            try {
              const creds = JSON.parse(fs.readFileSync('./session/main1/creds.json', 'utf8'))
              if (!creds?.registered) {
                if (!pairingCodeShown) pairingRequested = false
                startBot()
              }
            } catch {
              if (!pairingCodeShown) pairingRequested = false
              startBot()
            }
          }
        }, 5000)
        return
      }

      if (!loggedOut) {
        if (reconnectTimer) clearTimeout(reconnectTimer)
        reconnectTimer = setTimeout(() => startBot(), 3000)
      } else {
        console.log(`${c.yellow} Sesión cerrada (loggedOut). Borra ./session/main1 y vuelve a vincular.${c.reset}`)
      }
    }
  })

  sock.ev.on('messages.upsert', m => handleMessages(sock, m))
}

;(async () => {
  await pedirMetodo()
  await startBot()
})()
