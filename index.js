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
import qrcode from 'qrcode-terminal'

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (t) => new Promise(r => rl.question(t, r))

const c = {
  reset: '\x1b[0m',
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
console.log(`${c.pink}${c.bold}
  ██╗████████╗███████╗██╗ ██╗██╗ ██╗██╗ ██╗
  ██║╚══██╔══╝██╔════╝██║ ██║██║ ██╔╝██║ ███║
  ██║ ██║ ███████╗██║ ██║█████╔╝ ██║ ██║
  ██║ ██║ ╚════██║██║ ██║██╔═██╗ ██║ ██║
  ██║ ██║ ███████║╚██████╔╝██║ ██╗██║ ██╗ ██║
  ╚═╝ ╚═╝ ╚══════╝ ╚═════╝ ╚═╝ ╚═╝╚═╝ ╚═╝ ╚═╝${c.reset}`)
console.log(`${c.pink} Master Clover - Powered by DamianJS-ofc${c.reset}\n`)

function getWelcomeDB() {
  if (!fs.existsSync('./db')) fs.mkdirSync('./db', { recursive: true })
  if (!fs.existsSync('./db/welcome.json')) {
    fs.writeFileSync('./db/welcome.json', '{}')
    return {}
  }
  try {
    return JSON.parse(fs.readFileSync('./db/welcome.json', 'utf-8'))
  } catch {
    return {}
  }
}
function isWelcomeOn(groupId) {
  const db = getWelcomeDB()
  if (db[groupId] === undefined) return true
  return db[groupId] !== false
}

function normalizePhone(input) {
  let s = String(input || '').replace(/\D/g, '')
  if (!s) return ''
  if (s.startsWith('0')) s = s.replace(/^0+/, '')
  // CO móvil 10 dígitos empezando en 3
  if (s.length === 10 && s.startsWith('3')) s = '57' + s
  // MX
  if (s.startsWith('52') && !s.startsWith('521') && s.length >= 12) s = '521' + s.slice(2)
  // AR
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

// ─── Banderas críticas para el pairing ─────────────────────────────────────
let pairingRequested = false   // ya pedimos el código una vez
let pairingCodeShown = false   // ya lo mostramos en consola
let waitingPairing = false     // esperando que el usuario lo ingrese en el teléfono
let botStarted = false         // start()/loadPlugins solo una vez
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

/**
 * Pide el código UNA sola vez, cuando el socket ya existe.
 * No reinicia el bot si falla: reintenta el request en el mismo socket.
 */
async function requestCodeOnce(sock) {
  if (pairingRequested || pairingCodeShown) return
  if (sock.authState?.creds?.registered) return
  if (opcion !== '2' || !phoneNumber) return

  pairingRequested = true
  waitingPairing = true

  try {
    console.log(`\n${c.pink} Generando código para ${phoneNumber}...${c.reset}`)
    // Algunos builds de Baileys requieren un pequeño delay tras crear el socket
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
    pairingRequested = false // permitir un reintento
    console.log(`${c.yellow} ✖ Error al pedir código: ${e.message}${c.reset}`)
    console.log(`${c.pinkDim} Reintentando en 5s...${c.reset}`)
    setTimeout(() => requestCodeOnce(sock), 5000)
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
    // Importante en pairing: evita que se genere QR por debajo
    mobile: false
  })

  sock.ev.on('creds.update', saveCreds)

  // Pedir código cuando el socket arranca (solo modo 2, solo una vez)
  if (!state.creds?.registered && opcion === '2' && phoneNumber) {
    // requestPairingCode apenas el evento de conexión indique que está vivo
    // o, como fallback, tras un delay corto
    const tryRequest = () => requestCodeOnce(sock)
    setTimeout(tryRequest, 2000)
  }

  sock.ev.on('group-participants.update', async (anu) => {
    try {
      const { id, participants, action } = anu
      if (action !== 'add' && action !== 'remove') return
      if (!isWelcomeOn(id)) return

      const meta = await sock.groupMetadata(id).catch(() => null)
      const groupName = meta?.subject || 'este grupo'
      const total = meta?.participants?.length || 0

      const now = new Date()
      const hora = now.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
      const fecha = now.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })

      for (let raw of participants) {
        const user = typeof raw === 'string' ? raw : raw.id || raw.jid || ''
        if (!user) continue

        let ppUrl = null
        try {
          ppUrl = await sock.profilePictureUrl(user, 'image')
        } catch {
          ppUrl = null
        }
        const fallback =
          'https://raw.githubusercontent.com/starlyn-chann/Mistic-star/main/outl/1790152850509-GI88TJndzHvf.jpg'

        if (action === 'add') {
          const caption = `╭─ 🍀 𝙒𝙀𝙇𝘾𝙊𝙈𝙀 ──
│ 👤 Usuario: @${user.split('@')[0]}
│ 🏰 Grupo: ${groupName}
│ 🕒 Entró: ${hora}
│ 📅 Fecha: ${fecha}
│ 👥 Total: ${total}
╰──────────────`

          await sock.sendMessage(id, {
            image: { url: ppUrl || fallback },
            caption,
            mentions: [user]
          })
        }

        if (action === 'remove') {
          const caption = `╭─ 👋 𝙂𝙊𝘿𝘽𝙔𝙀 ──
│ 👤 Usuario: @${user.split('@')[0]}
│ 🏰 Grupo: ${groupName}
│ Se fue, una hoja menos.
╰──────────────`

          await sock.sendMessage(id, {
            image: { url: ppUrl || fallback },
            caption,
            mentions: [user]
          })
        }
      }
    } catch (e) {
      console.log('ERROR WELCOME:', e)
    }
  })

  sock.ev.on('connection.update', async (update) => {
    const { qr, connection, lastDisconnect, isNewLogin } = update

    if (qr && opcion === '1') {
      console.log(`${c.pink}${c.bold} ✿ Escanea este código QR${c.reset}\n`)
      qrcode.generate(qr, { small: true })
    }

    // Si estamos en modo código y aún no registrado, intentar pedir el código
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
      console.log(`${c.pink} ★ CONECTADO COMO MASTER CLOVER ★${c.reset}`)
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
    }

    if (connection === 'close') {
      const status = lastDisconnect?.error?.output?.statusCode
      const loggedOut = status === DisconnectReason.loggedOut

      // 🔑 CLAVE: mientras esperamos que el usuario escriba el código,
      // NO reiniciar el bot (eso invalidaba el código mostrado).
      if (waitingPairing && !loggedOut && !sock.authState?.creds?.registered) {
        console.log(
          `${c.pinkDim} Esperando vinculación… no reinicio el proceso.${c.reset}`
        )
        // Reabrir socket SIN pedir un código nuevo (pairingRequested sigue true
        // si ya se mostró; si aún no, requestCodeOnce podrá intentarlo).
        if (reconnectTimer) clearTimeout(reconnectTimer)
        reconnectTimer = setTimeout(() => {
          // Solo reconectar si sigue sin registrarse
          if (!fs.existsSync('./session/main1/creds.json')) {
            // reset suave de la bandera de request si nunca se mostró código
            if (!pairingCodeShown) pairingRequested = false
            startBot()
          } else {
            try {
              const creds = JSON.parse(
                fs.readFileSync('./session/main1/creds.json', 'utf8')
              )
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