import makeWASocket, {
  Browsers,
  makeCacheableSignalKeyStore,
  DisconnectReason,
  jidDecode,
  useMultiFileAuthState,
  fetchLatestWaWebVersion,
  fetchLatestBaileysVersion
} from 'WhiskeySockets-locosyasociados'
import NodeCache from 'node-cache'
import pino from 'pino'
import fs from 'fs'
import path from 'path'

const logger = pino({ level: 'silent' })
const msgRetryCounterCache = new NodeCache({ stdTTL: 0, checkperiod: 0 })
const userDevicesCache = new NodeCache({ stdTTL: 0, checkperiod: 0 })

const subs = new Map()
const firstConnection = new Set()
const reconectando = new Map()
const reconnectTimer = new Map()
const reconnectAttempts = new Map()
const processedMessages = new Set()
const pairingCodeRequests = new Map()
const pendingPairingCodes = new Map()
const pendingPairingCleanup = new Map()
const sessionIntegrityTimer = new Map()

const PAIRING_CLEANUP_MS = 90_000
const CONNECTION_WAIT_MS = 180_000
const SESSION_INTEGRITY_FIRST_CHECK_MS = 30_000
const SESSION_INTEGRITY_INTERVAL_MS = 60_000

const sleep = (ms) => new Promise(r => setTimeout(r, ms))
const cleanNumber = (n = '') => String(n).replace(/\D/g, '')

function isValidBotNumber(number = '') {
  const n = cleanNumber(number)
  return /^\d{7,15}$/.test(n) && !/^0+$/.test(n)
}

function safeEnd(sock) {
  try {
    if (!sock) return
    sock._misticManualClose = true
    sock?.end?.()
  } catch {}
}

function safeRemoveDir(dir) {
  try {
    if (dir && fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true })
  } catch {}
}

function hasRegisteredCreds(sock) {
  return sock?.authState?.creds?.registered === true
}

function isRegisteredSocket(sock) {
  return hasRegisteredCreds(sock) && !!sock?.user
}

function formatDelay(ms) {
  const s = Math.ceil(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const r = s % 60
  return r ? `${m}m ${r}s` : `${m}m`
}

function getReconnectDelay(statusCode, attempt) {
  const baseDelay =
    statusCode === DisconnectReason.restartRequired || statusCode === 515 ? 1_000 :
    statusCode === 503 ? 20_000 :
    statusCode === 408 ? 30_000 :
    statusCode === 428 ? 15_000 :
    statusCode === 0 ? 45_000 :
    10_000
  const maxDelay = statusCode === DisconnectReason.restartRequired || statusCode === 515
    ? 30_000
    : 5 * 60_000
  const multiplier = Math.min(2 ** Math.max(0, attempt - 1), 8)
  const delay = Math.min(baseDelay * multiplier, maxDelay)
  const jitterLimit = statusCode === 503 ? Math.min(30_000, delay * 0.8) : Math.min(5_000, delay * 0.2)
  return delay + Math.floor(Math.random() * jitterLimit)
}

function clearReconnectState(subNumber) {
  reconectando.delete(subNumber)
  reconnectAttempts.delete(subNumber)
  const t = reconnectTimer.get(subNumber)
  if (t) clearTimeout(t)
  reconnectTimer.delete(subNumber)
}

function stopSessionIntegrityCheck(subNumber) {
  const t = sessionIntegrityTimer.get(subNumber)
  if (t) clearInterval(t)
  sessionIntegrityTimer.delete(subNumber)
}

function clearPendingPairing(subNumber) {
  const t = pendingPairingCleanup.get(subNumber)
  if (t) clearTimeout(t)
  pendingPairingCleanup.delete(subNumber)
  pendingPairingCodes.delete(subNumber)
  pairingCodeRequests.delete(subNumber)
}

function getPath(clean) {
  const p1 = path.join(process.cwd(), 'subbots', clean)
  const p2 = path.join(process.cwd(), 'jadiBots', clean)
  if (fs.existsSync(p1)) return p1
  if (fs.existsSync(p2)) return p2
  return p1
}

function getConfigPath(clean) {
  return path.join(getPath(clean), 'config.json')
}

export function getSubConfig(clean) {
  clean = cleanNumber(clean)
  const dir = getPath(clean)
  const file = getConfigPath(clean)
  const def = {
    name: 'MASTER CLOVER',
    banner: 'https://raw.githubusercontent.com/starlyn-chann/Mistic-star/main/tourl/1793791128830-SCTBirKkcY5P.jpg',
    theme: 'normal',
    prefix: '.'
  }
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(def, null, 2))
    return def
  }
  try {
    return { ...def, ...JSON.parse(fs.readFileSync(file, 'utf8')) }
  } catch {
    return def
  }
}

export function saveSubConfig(clean, newData) {
  clean = cleanNumber(clean)
  const dir = getPath(clean)
  const file = getConfigPath(clean)
  const merged = { ...getSubConfig(clean), ...(newData || {}) }
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(file, JSON.stringify(merged, null, 2))
  return merged
}

async function getWaVersion() {
  try {
    const r = await Promise.allSettled([
      typeof fetchLatestWaWebVersion === 'function' ? fetchLatestWaWebVersion() : Promise.reject(new Error('no fn')),
      typeof fetchLatestBaileysVersion === 'function' ? fetchLatestBaileysVersion() : Promise.reject(new Error('no fn'))
    ])
    const vs = r
      .filter(x => x.status === 'fulfilled' && x.value?.version)
      .map(x => x.value.version)
    if (!vs.length) {
      console.log('[SUBBOT] Fallback a version fija, ninguna fuente respondio')
      return [2, 3000, 1043857760]
    }
    const version = vs.sort((a, b) => b[2] - a[2])[0]
    console.log('[SUBBOT] WA WEB VERSION:', version)
    return version
  } catch {
    console.log('[SUBBOT] Fallback a version fija por error')
    return [2, 3000, 1043857760]
  }
}

function cleanupUnregistered(clean, sock, dir, reason) {
  if (!isValidBotNumber(clean)) return false
  const cur = subs.get(clean)
  const curSock = cur?.sock || sock
  if (hasRegisteredCreds(curSock)) return false
  if (curSock) safeEnd(curSock)
  if (sock && sock !== curSock) safeEnd(sock)
  subs.delete(clean)
  firstConnection.delete(clean)
  clearReconnectState(clean)
  clearPendingPairing(clean)
  stopSessionIntegrityCheck(clean)
  safeRemoveDir(dir)
  safeRemoveDir(path.join(process.cwd(), 'jadiBots', clean))
  safeRemoveDir(path.join(process.cwd(), 'subbots', clean))
  if (reason) console.log(`[SUBBOT ${clean}] Sesión temporal limpiada: ${reason}`)
  return true
}

function schedulePairingCleanup(clean, sock, dir, code) {
  if (!isValidBotNumber(clean)) return
  clearPendingPairing(clean)
  pendingPairingCodes.set(clean, { code, expiresAt: Date.now() + 60_000 })
  const timer = setTimeout(() => {
    const curSock = subs.get(clean)?.sock || sock
    if (hasRegisteredCreds(curSock)) {
      clearPendingPairing(clean)
      return
    }
    cleanupUnregistered(clean, curSock, dir, 'pairing no completado')
  }, PAIRING_CLEANUP_MS)
  pendingPairingCleanup.set(clean, timer)
}

async function handleIncomingMessages(sock, subNumber) {
  if (sock._subHandlerBound) return
  sock._subHandlerBound = true

  sock.ev.on('messages.upsert', async (up) => {
    if (up.type !== 'notify') return

    for (const raw of up.messages || []) {
      try {
        if (!raw?.message || raw.key?.remoteJid === 'status@broadcast') continue
        if (raw.message.ephemeralMessage) raw.message = raw.message.ephemeralMessage.message

        const msgId = raw.key?.id
        const dedupeKey = msgId ? `${subNumber}:${raw.key?.remoteJid || ''}:${msgId}` : null
        if (dedupeKey && processedMessages.has(dedupeKey)) continue

        const mainPath = path.join(process.cwd(), 'main.js')
        const { handleMessages } = await import(`file://${mainPath}`)
        
        await handleMessages(sock, up)

        if (dedupeKey) {
          processedMessages.add(dedupeKey)
          if (processedMessages.size > 2000) {
            for (const id of [...processedMessages].slice(0, 1000)) processedMessages.delete(id)
          }
        }
      } catch (e) {
        console.log(`[SUBBOT ${subNumber}] Error procesando mensaje: ${e.message}`)
      }
    }
  })
}

export async function createJadiBot(mainSock, m, phone, handleCommand, esReconexion = false, hooks = {}) {
  const clean = cleanNumber(phone)
  if (!isValidBotNumber(clean)) throw new Error(`Número de subbot inválido: ${clean || phone}`)

  const dir = getPath(clean)
  const existing = subs.get(clean)

  if (isRegisteredSocket(existing?.sock) && !esReconexion) return existing.sock
  if (existing?.sock && !esReconexion) {
    safeEnd(existing.sock)
    subs.delete(clean)
    clearPendingPairing(clean)
  }

  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!esReconexion) getSubConfig(clean)

  const { state, saveCreds } = await useMultiFileAuthState(dir)
  const version = await getWaVersion()

  let sessionInvalid = false
  let saveCredsQueue = Promise.resolve()

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    browser: Browsers.windows('Chrome'),
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, logger) },
    markOnlineOnConnect: false,
    syncFullHistory: false,
    keepAliveIntervalMs: 30000,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000,
    msgRetryCounterCache,
    userDevicesCache
  })

  sock.authState = state
  sock.isSubBot = true
  sock.subNumber = clean
  sock.subConfig = getSubConfig(clean)
  sock.decodeJid = (jid) => {
    if (!jid) return jid
    if (/:\d+@/gi.test(jid)) {
      const d = jidDecode(jid) || {}
      return (d.user && d.server && d.user + '@' + d.server) || jid
    }
    return jid
  }

  subs.set(clean, {
    sock,
    phone: clean,
    config: sock.subConfig,
    uptime: Date.now(),
    prefixes: [sock.subConfig.prefix || '.']
  })

  clearReconnectState(clean)

  const persistCreds = () => {
    if (sessionInvalid) return
    firstConnection.add(clean)
    saveCredsQueue = saveCredsQueue
      .then(async () => {
        if (sessionInvalid) return
        await saveCreds()
      })
    .catch(() => {})
  }
  sock.ev.on('creds.update', persistCreds)

  await handleIncomingMessages(sock, clean)

  if (!state.creds.registered && !esReconexion) {
    if (pairingCodeRequests.has(clean)) {
      const old = pendingPairingCodes.get(clean)
      if (old && Date.now() < old.expiresAt && hooks.onCode) await hooks.onCode(old.code)
    } else {
      pairingCodeRequests.set(clean, true)
      let codigoPedido = false
      sock.ev.on('connection.update', async ({ qr }) => {
        if (!qr || codigoPedido) return
        codigoPedido = true
        try {
          if (sock.authState?.creds?.registered) {
            clearPendingPairing(clean)
            return
          }
          await sleep(1000)
          const raw = await sock.requestPairingCode(clean)
          if (sock.authState?.creds?.registered) {
            clearPendingPairing(clean)
            return
          }
          const fmt = String(raw).replace(/-/g, '').match(/.{1,4}/g)?.join('-') || raw
          pendingPairingCodes.set(clean, { code: fmt, expiresAt: Date.now() + 60_000 })
          console.log(`[SUBBOT] Codigo para ${clean}: ${fmt} | WA VERSION: ${version}`)
          schedulePairingCleanup(clean, sock, dir, fmt)
          if (hooks.onCode) await hooks.onCode(fmt)
        } catch (e) {
          console.log(`[SUBBOT] Error codigo ${clean}:`, e.message)
          pairingCodeRequests.delete(clean)
          if (hooks.onError) await hooks.onError(`No se pudo generar el código: ${e?.message}`)
        }
      })
    }
  }

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update
    const statusCode = lastDisconnect?.error?.output?.statusCode || 0

    if (connection === 'open') {
      clearReconnectState(clean)
      clearPendingPairing(clean)
      stopSessionIntegrityCheck(clean)
      if (!hasRegisteredCreds(sock)) {
        cleanupUnregistered(clean, sock, dir, 'open sin creds registradas')
        return
      }
      console.log(`[SUBBOT ${clean}] Conectado`)
      const integrityTimer = setInterval(() => {
        const cur = subs.get(clean)
        if (!cur || cur.sock !== sock) {
          stopSessionIntegrityCheck(clean)
          return
        }
        if (!isRegisteredSocket(sock)) return
        const credsPath = path.join(dir, 'creds.json')
        if (!fs.existsSync(credsPath)) {
          console.log('[SUBBOT] creds.json no existe, NO borro sesion')
          persistCreds()
        }
      }, SESSION_INTEGRITY_INTERVAL_MS)
      sessionIntegrityTimer.set(clean, integrityTimer)
      if (hooks.onConnected) await hooks.onConnected(sock)
      return
    }
if (connection === 'close') {
      if (sock._misticManualClose) return
      if (reconectando.get(clean) || reconnectTimer.get(clean)) return

      if (!hasRegisteredCreds(sock)) {
        if ([401, 403, DisconnectReason.loggedOut].includes(statusCode)) {
          cleanupUnregistered(clean, sock, dir, `pairing cerrado (${statusCode})`)
          if (hooks.onClose) await hooks.onClose('sesión cerrada')
          return
        }
        console.log(`[SUBBOT ${clean}] Emparejamiento interrumpido (${statusCode}); conservando sesión para reconectar`)
      }

      if ([401, 403, DisconnectReason.loggedOut].includes(statusCode)) {
        sessionInvalid = true
        const cur = subs.get(clean)
        safeEnd(cur?.sock || sock)
        subs.delete(clean)
        firstConnection.delete(clean)
        clearReconnectState(clean)
        clearPendingPairing(clean)
        stopSessionIntegrityCheck(clean)
        await saveCredsQueue.catch(() => {})
        await sleep(300)
        safeRemoveDir(dir)
        safeRemoveDir(path.join(process.cwd(), 'jadiBots', clean))
        safeRemoveDir(path.join(process.cwd(), 'subbots', clean))
        if (hooks.onClose) await hooks.onClose('sesión cerrada')
        return
      }

      // FIX 440 / connectionReplaced: ya NO borra, cae al reconectador de abajo
      if (statusCode === DisconnectReason.connectionReplaced || statusCode === 440) {
        console.log(`[SUBBOT ${clean}] Conexión reemplazada (440), reconectando...`)
      }

      reconectando.set(clean, true)
      const attempt = (reconnectAttempts.get(clean) || 0) + 1
      reconnectAttempts.set(clean, attempt)
      const delay = getReconnectDelay(statusCode, attempt)
      console.log(`[SUBBOT ${clean}] Reconectando en ${formatDelay(delay)}... (${statusCode}, intento ${attempt})`)

      const timer = setTimeout(async () => {
        try {
          const cur = subs.get(clean)
          if (cur?.sock) safeEnd(cur.sock)
          subs.delete(clean)
          await createJadiBot(mainSock, m, clean, handleCommand, true, hooks)
        } catch (err) {
          console.log(`[SUBBOT ${clean}] Error reconectando: ${err.message}`)
          reconectando.delete(clean)
          reconnectTimer.delete(clean)
        } finally {
          reconectando.delete(clean)
          reconnectTimer.delete(clean)
        }
      }, delay)
      reconnectTimer.set(clean, timer)
    }
  })

  return sock
}

export function getPairingCode(number, userConfig = {}) {
  const clean = cleanNumber(number)
  if (!isValidBotNumber(clean)) throw new Error(`Número de subbot inválido: ${clean || number}`)
  const dir = getPath(clean)

  const pending = pendingPairingCodes.get(clean)
  if (pending && pending.expiresAt > Date.now() && pendingPairingCleanup.has(clean)) {
    return Promise.resolve({ status: 'pending', code: pending.code, number: clean })
  }
  if (pending) cleanupUnregistered(clean, subs.get(clean)?.sock, dir, 'código vencido')

  const active = pairingCodeRequests.get(clean)
  if (active && active.then) return active

  const request = (async () => {
    try {
      return await requestPairingAttempt(clean, userConfig)
    } catch (err) {
      cleanupUnregistered(clean, subs.get(clean)?.sock, dir, 'error pairing')
      throw err
    }
  })()

  pairingCodeRequests.set(clean, request)
  return request.finally(() => {
    if (pairingCodeRequests.get(clean) === request) pairingCodeRequests.delete(clean)
  })
}

async function requestPairingAttempt(clean, userConfig = {}) {
  const dir = getPath(clean)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  return new Promise(async (resolve, reject) => {
    let resolved = false
    let codeRequested = false
    let sock = null
    let timeout = null

    const finish = (data, isError = false) => {
      if (resolved) return
      resolved = true
      if (timeout) clearTimeout(timeout)
      isError ? reject(data) : resolve(data)
    }

    timeout = setTimeout(() => {
      cleanupUnregistered(clean, sock, dir, 'tiempo agotado')
      finish({ status: 'timeout', code: null, number: clean })
    }, 60_000)

    const requestCode = async () => {
      if (resolved || codeRequested || !sock) return
      if (hasRegisteredCreds(sock)) return finish({ status: 'connected', code: null, number: clean })
      codeRequested = true
      try {
        if (typeof sock.waitForSocketOpen === 'function') await sock.waitForSocketOpen()
        await sleep(1500)
        if (resolved) return
        if (hasRegisteredCreds(sock)) return finish({ status: 'connected', code: null, number: clean })
        if (!sock.ws?.isOpen || subs.get(clean)?.sock !== sock) throw new Error('Connection Closed')
        const code = await sock.requestPairingCode(clean)
        if (resolved) return
        if (isRegisteredSocket(sock)) return finish({ status: 'connected', code: null, number: clean })
        const fmt = String(code).replace(/-/g, '').match(/.{1,4}/g)?.join('-') || code
        schedulePairingCleanup(clean, sock, dir, fmt)
        finish({ status: 'pending', code: fmt, number: clean })
      } catch (err) {
        cleanupUnregistered(clean, sock, dir, `error pairing: ${err?.message || err}`)
        finish(err, true)
      }
    }

    try {
      sock = await createJadiBot(null, null, clean, null, false, {
        onConnected: () => finish({ status: 'connected', code: null, number: clean }),
        onCode: (code) => finish({ status: 'pending', code, number: clean }),
        onError: (msg) => {
          cleanupUnregistered(clean, sock, dir, msg)
          finish(new Error(msg), true)
        }
      })
      if (hasRegisteredCreds(sock)) return finish({ status: 'connected', code: null, number: clean })
      sock.ev.on('connection.update', async (u) => {
        if (resolved) return
        if (u.connection === 'open') return finish({ status: 'connected', code: null, number: clean })
        if (u.connection === 'connecting' || u.qr) await requestCode()
      })
      await requestCode()
    } catch (err) {
      cleanupUnregistered(clean, sock, dir, `error iniciando pairing: ${err?.message || err}`)
      finish(err, true)
    }
  })
}

export function waitForSubConnection(number, timeoutMs = CONNECTION_WAIT_MS) {
  const clean = cleanNumber(number)
  return new Promise((resolve) => {
    let done = false
    let timer = null
    let interval = null
    const finish = (v) => {
      if (done) return
      done = true
      if (timer) clearTimeout(timer)
      if (interval) clearInterval(interval)
      resolve(v)
    }
    const check = () => {
      const cur = subs.get(clean)?.sock
      if (isRegisteredSocket(cur)) return finish(true)
      if (!cur && !pendingPairingCleanup.has(clean) && !reconnectTimer.has(clean) && !reconectando.has(clean)) {
        finish(false)
      }
    }
    interval = setInterval(check, 1000)
    timer = setTimeout(() => finish(false), timeoutMs)
    check()
  })
}

export function getSubs() {
  return subs
}

export function getSub(number) {
  return subs.get(cleanNumber(number))
}

export function removeSub(number) {
  const clean = cleanNumber(number)
  const data = subs.get(clean)
  if (data?.sock) safeEnd(data.sock)
  subs.delete(clean)
  firstConnection.delete(clean)
  clearReconnectState(clean)
  clearPendingPairing(clean)
  stopSessionIntegrityCheck(clean)
  safeRemoveDir(getPath(clean))
  safeRemoveDir(path.join(process.cwd(), 'jadiBots', clean))
  safeRemoveDir(path.join(process.cwd(), 'subbots', clean))
  console.log(`[SUBBOT ${clean}] Eliminado`)
}

export function getConnectionStatus() {
  const arr = Array.from(subs.values())
  const active = arr.filter(s => isRegisteredSocket(s.sock)).length
  return { total: subs.size, active }
}

export {
  cleanNumber,
  isValidBotNumber
}

export default {
  createJadiBot,
  getPairingCode,
  waitForSubConnection,
  getSubs,
  getSub,
  removeSub,
  getConnectionStatus,
  getSubConfig,
  saveSubConfig,
  cleanNumber,
  isValidBotNumber
}