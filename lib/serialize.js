import fs from 'fs'
import axios from 'axios'
import { jidDecode, getContentType, extractMessageContent, downloadContentFromMessage, getDevice, areJidsSameUser, generateForwardMessageContent } from 'baileys'
import exif from './exif.js'

const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = exif

class BoundedMap {
  #map = new Map()
  #max
  #ttl
  constructor(max, ttlMs = 0) { this.#max = max; this.#ttl = ttlMs }
  #expired(e) { return this.#ttl > 0 && Date.now() - e.ts > this.#ttl }
  has(k) {
    const e = this.#map.get(k)
    if (!e) return false
    if (this.#expired(e)) { this.#map.delete(k); return false }
    return true
  }
  get(k) {
    const e = this.#map.get(k)
    if (!e) return undefined
    if (this.#expired(e)) { this.#map.delete(k); return undefined }
    return e.v
  }
  set(k, v) {
    if (this.#map.size >= this.#max) this.#map.delete(this.#map.keys().next().value)
    this.#map.set(k, { v, ts: Date.now() })
  }
}

const lidCache = new BoundedMap(2000, 24 * 60 * 60_000)
const lidNegativeCache = new BoundedMap(5000, 30_000)
const GROUP_METADATA_CACHE_TTL = 5 * 60_000

function cleanNumber(raw) {
  if (!raw) return ''
  let s = String(raw)
  if (s.includes('@')) s = s.split('@')[0]
  if (s.includes(':')) s = s.split(':')[0]
  return s.replace(/\D/g, '')
}

function normalizeJid(raw) {
  if (!raw) return null
  const s = typeof raw === 'number' ? String(raw) : String(raw).trim()
  if (!s) return null
  if (s.endsWith('@g.us')) return s
  if (s.endsWith('@newsletter')) return s
  if (s.endsWith('@lid')) return s
  if (/:\d+@/i.test(s)) {
    const decoded = jidDecode(s)
    if (decoded?.user && decoded?.server) return `${decoded.user}@${decoded.server}`
  }
  if (s.endsWith('@s.whatsapp.net')) return s
  const digits = s.replace(/\D/g, '')
  if (digits && digits.length >= 4 && digits.length <= 15) return `${digits}@s.whatsapp.net`
  return s
}

function jidUser(raw) {
  const normalized = normalizeJid(raw)
  if (!normalized) return null
  return normalized.split('@')[0].split(':')[0] || null
}

function buildAdminSet(participants) {
  const s = new Set()
  for (const p of participants ?? []) {
    if (p.admin !== 'admin' && p.admin !== 'superadmin') continue
    const id = jidUser(p.id)
    const lid = jidUser(p.lid)
    const phone = jidUser(p.phoneNumber)
    if (id) s.add(id)
    if (lid) s.add(lid)
    if (phone) s.add(phone)
  }
  return s
}

const adminSetByMeta = new WeakMap()
function getAdminSet(groupMetadata) {
  if (!groupMetadata) return new Set()
  let s = adminSetByMeta.get(groupMetadata)
  if (!s) { s = buildAdminSet(groupMetadata.participants); adminSetByMeta.set(groupMetadata, s) }
  return s
}

function isGroupAdmin(groupMetadata, jid) {
  const user = jidUser(jid)
  return Boolean(user && getAdminSet(groupMetadata).has(user))
}

function resolveParticipantJid(p) {
  if (!p) return null
  if (p.phoneNumber) {
    const n = normalizeJid(p.phoneNumber)
    if (n && !n.endsWith('@lid')) return n
  }
  if (p.id && !p.id.endsWith('@lid')) {
    const n = normalizeJid(p.id)
    if (n && !n.endsWith('@lid')) return n
  }
  if (p.jid && !p.jid.endsWith('@lid')) {
    const n = normalizeJid(p.jid)
    if (n && !n.endsWith('@lid')) return n
  }
  const rawLid = p.lid || (p.id?.endsWith('@lid') ? p.id : null)
  if (rawLid) {
    if (lidCache.has(rawLid)) return lidCache.get(rawLid)
    return rawLid
  }
  return null
}

function withTimeout(promise, ms) {
  return new Promise(resolve => {
    let done = false
    const timer = setTimeout(() => { if (!done) { done = true; resolve(null) } }, ms)
    Promise.resolve(promise).then(
      v => { if (!done) { done = true; clearTimeout(timer); resolve(v) } },
      () => { if (!done) { done = true; clearTimeout(timer); resolve(null) } }
    )
  })
}

async function resolveLidsAsync(lids, sock) {
  const list = [...new Set((lids ?? []).filter(l => l?.endsWith('@lid')))]
  const result = new Map()
  if (!list.length) return result
  const lm = sock?.signalRepository?.lidMapping
  if (!lm) return result
  const pending = list.filter(l => !lidNegativeCache.has(l))
  if (!pending.length) return result
  const resolvedSet = new Set()
  if (typeof lm.getPNsForLIDs === 'function') {
    let pairs = null
    try { pairs = await withTimeout(lm.getPNsForLIDs(pending), 2000) } catch { pairs = null }
    if (Array.isArray(pairs)) {
      for (const pair of pairs) {
        const n = normalizeJid(pair?.pn)
        if (pair?.lid && n && !n.endsWith('@lid')) {
          lidCache.set(pair.lid, n)
          result.set(pair.lid, n)
          resolvedSet.add(pair.lid)
        }
      }
    }
  } else if (typeof lm.getPNForLID === 'function') {
    await Promise.all(pending.map(async lid => {
      let pn = null
      try { pn = await withTimeout(lm.getPNForLID(lid), 2000) } catch { pn = null }
      const n = normalizeJid(pn)
      if (n && !n.endsWith('@lid')) {
        lidCache.set(lid, n)
        result.set(lid, n)
        resolvedSet.add(lid)
      }
    }))
  }
  for (const l of pending) if (!resolvedSet.has(l)) lidNegativeCache.set(l, true)
  return result
}

async function resolveLidAsync(lid, sock) {
  if (!lid?.endsWith('@lid')) return null
  const map = await resolveLidsAsync([lid], sock)
  return map.get(lid) || null
}

async function resolveJidAsync(raw, sock, groupJid) {
  if (!raw) return null
  const norm = normalizeJid(raw)
  if (!norm) return null
  if (!norm.endsWith('@lid')) return norm
  if (lidCache.has(norm)) return lidCache.get(norm)
  const viaStore = await resolveLidAsync(norm, sock)
  if (viaStore) return viaStore
  if (groupJid?.endsWith('@g.us') && sock?.groupMetadata) {
    try {
      const meta = await sock.groupMetadata(groupJid)
      const lidBase = norm.split('@')[0]
      for (const p of meta?.participants ?? []) {
        const pLid = p.lid?.split('@')[0]
        const pId = (p.id && !p.id.endsWith('@lid')) ? p.id.split('@')[0] : null
        if (pLid !== lidBase && pId !== lidBase) continue
        const phone = p.phoneNumber ? normalizeJid(p.phoneNumber) : (p.id && !p.id.endsWith('@lid') ? normalizeJid(p.id) : null)
        if (phone) { lidCache.set(norm, phone); return phone }
      }
    } catch {}
  }
  lidNegativeCache.set(norm, true)
  return norm
}

async function resolveParticipants(participants, sock) {
  if (!Array.isArray(participants)) return []
  const prelim = participants.map(p => ({ p, realJid: resolveParticipantJid(p) }))
  const unresolved = prelim.filter(e => e.realJid?.endsWith('@lid')).map(e => e.realJid)
  const batch = unresolved.length ? await resolveLidsAsync(unresolved, sock) : new Map()
  return prelim.map(({ p, realJid }) => {
    const finalJid = (realJid?.endsWith('@lid') ? batch.get(realJid) : null) || realJid
    if (!finalJid) return p
    const originalLid = p.lid || (p.id?.endsWith('@lid') ? p.id : undefined)
    const phoneNumber = p.phoneNumber || (!finalJid.endsWith('@lid') ? finalJid : undefined)
    return { ...p, ...(originalLid ? { lid: originalLid } : {}), ...(phoneNumber ? { phoneNumber } : {}) }
  }).filter(p => p.id)
}

function patchGroupMetadata(sock) {
  if (sock.groupMetadataPatched) return
  if (typeof sock.groupMetadata !== 'function') return
  const orig = sock.groupMetadata.bind(sock)
  const cache = new Map()
  const inFlight = new Map()
  const cacheKey = jid => normalizeJid(jid) || String(jid || '')
  sock.groupMetadata = async jid => {
    const key = cacheKey(jid)
    const cached = cache.get(key)
    if (cached && cached.expiresAt > Date.now()) return cached.metadata
    if (inFlight.has(key)) return inFlight.get(key)
    const request = (async () => {
      const meta = await orig(jid)
      if (!meta || !Array.isArray(meta.participants)) throw new TypeError(`Metadata inválida para ${key}`)
      const metadata = { ...meta, participants: await resolveParticipants(meta.participants, sock) }
      cache.set(key, { metadata, expiresAt: Date.now() + GROUP_METADATA_CACHE_TTL })
      return metadata
    })()
    inFlight.set(key, request)
    try { return await request } finally { inFlight.delete(key) }
  }
  sock.ev?.on('group-participants.update', ({ id }) => { cache.delete(cacheKey(id)); inFlight.delete(cacheKey(id)) })
  sock.ev?.on('groups.update', updates => { for (const u of updates ?? []) { cache.delete(cacheKey(u?.id)); inFlight.delete(cacheKey(u?.id)) } })
  sock.groupMetadataPatched = true
}

async function getBuffer(url, options = {}) {
  const res = await axios({ method: 'get', url, headers: { DNT: 1, 'Upgrade-Insecure-Request': 1 }, responseType: 'arraybuffer', timeout: 30_000, ...options })
  return res.data
}

async function smsg(sock, msg, store) {
  if (!sock.decodeJid) {
    sock.decodeJid = jid => {
      if (!jid) return jid
      if (/:\d+@/gi.test(jid)) {
        const decoded = jidDecode(jid) || {}
        return (decoded.user && decoded.server && decoded.user + '@' + decoded.server) || jid
      }
      return jid
    }
  }

  patchGroupMetadata(sock)

  if (!sock.downloadMediaMessage) {
    sock.downloadMediaMessage = async message => {
      const m = message.msg || message
      const normalized = message.message ? extractMessageContent(message.message) : null
      const realType = (normalized && getContentType(normalized)) || message.type
      const mime = m.mimetype || ''
      const messageType = (realType || mime.split('/')[0] || '').replace(/Message/gi, '')
      const stream = await downloadContentFromMessage(m, messageType)
      let buffer = Buffer.from([])
      for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
      return buffer
    }
  }

  if (!msg) return msg
  if (msg.key) {
    msg.id = msg.key.id
    msg.chat = msg.key.remoteJid
    msg.fromMe = msg.key.fromMe
    msg.isGroup = msg.chat?.endsWith('@g.us') ?? false
    if (!msg.isGroup && msg.chat?.endsWith('@lid')) {
      const resolved = await resolveJidAsync(msg.chat, sock, null)
      if (resolved && !resolved.endsWith('@lid')) msg.chat = resolved
    }
    const rawSender = (msg.fromMe && sock.user.id) || msg.key?.participant || msg.key?.remoteJid || ''
    msg.sender = await resolveJidAsync(sock.decodeJid(rawSender), sock, msg.key?.remoteJid)
  }

  if (msg.message) {
    msg.type = getContentType(msg.message) || Object.keys(msg.message)[0]
    msg.msg = /viewOnceMessage|viewOnceMessageV2Extension|editedMessage|ephemeralMessage/i.test(msg.type)
      ? msg.message[msg.type].message[getContentType(msg.message[msg.type].message)]
      : extractMessageContent(msg.message[msg.type]) || msg.message[msg.type]
    msg.body = msg.message?.conversation
      || msg.msg?.text
      || msg.msg?.conversation
      || msg.msg?.caption
      || msg.msg?.selectedButtonId
      || msg.msg?.singleSelectReply?.selectedRowId
      || msg.msg?.selectedId
      || msg.msg?.contentText
      || msg.msg?.selectedDisplayText
      || msg.msg?.title
      || msg.msg?.name
      || ''
    msg.text = msg.body
    const rawMentioned = msg.msg?.contextInfo?.mentionedJid ?? []
    msg.mentionedJid = (await Promise.all(rawMentioned.map(j => resolveJidAsync(j, sock, msg.chat)))).filter(Boolean)
    msg.device = getDevice(msg.id)
    msg.timestamp = (typeof msg.messageTimestamp === 'number' ? msg.messageTimestamp : msg.messageTimestamp?.low || msg.messageTimestamp?.high) || (msg.msg?.timestampMs * 1000)
    msg.isMedia = !!msg.msg?.mimetype || !!msg.msg?.thumbnailDirectPath
    if (msg.isMedia) {
      msg.mime = msg.msg?.mimetype
      msg.size = msg.msg?.fileLength
      msg.height = msg.msg?.height || ''
      msg.width = msg.msg?.width || ''
      if (/webp/i.test(msg.mime)) msg.isAnimated = msg.msg?.isAnimated
    }
    msg.quoted = msg.msg?.contextInfo?.quotedMessage ? {} : null
    if (msg.quoted) {
      msg.quoted.message = extractMessageContent(msg.msg?.contextInfo?.quotedMessage)
      msg.quoted.type = getContentType(msg.quoted.message) || Object.keys(msg.quoted.message)[0]
      msg.quoted.msg = extractMessageContent(msg.quoted.message[msg.quoted.type]) || msg.quoted.message[msg.quoted.type]
      msg.quoted.id = msg.msg.contextInfo.stanzaId
      msg.quoted.chat = msg.msg.contextInfo.remoteJid || msg.chat
      const rawQP = msg.msg?.contextInfo?.participant ?? ''
      msg.quoted.sender = await resolveJidAsync(sock.decodeJid(rawQP), sock, msg.chat)
      msg.quoted.fromMe = areJidsSameUser(msg.quoted.sender, sock.decodeJid(sock.user.id))
      msg.quoted.text = msg.quoted.msg?.text || msg.quoted.msg?.caption || msg.quoted.msg?.conversation || ''
      msg.quoted.key = {
        remoteJid: msg.msg?.contextInfo?.remoteJid || msg.chat,
        participant: msg.quoted.sender,
        fromMe: areJidsSameUser(sock.decodeJid(msg.msg?.contextInfo?.participant), sock.decodeJid(sock?.user?.id)),
        id: msg.msg?.contextInfo?.stanzaId
      }
      msg.quoted.download = () => sock.downloadMediaMessage(msg.quoted)
    }
  }

  msg.download = () => sock.downloadMediaMessage(msg)
  msg.react = u => sock.sendMessage(msg.chat, { react: { text: u, key: msg.key } })
  msg.reply = async (content, options = {}) => {
    if (typeof content === 'object') return sock.sendMessage(msg.chat, content, { ...options, quoted: msg })
    return sock.sendMessage(msg.chat, { text: content, ...options }, { quoted: msg })
  }

  if (!sock.sendImageAsSticker) {
    sock.sendImageAsSticker = async (jid, p, quoted, options = {}) => {
      const buff = Buffer.isBuffer(p) ? p : /^data:.*?\/.*?;base64,/i.test(p) ? Buffer.from(p.split`,`[1], 'base64') : /^https?:\/\//.test(p) ? await getBuffer(p) : fs.existsSync(p) ? fs.readFileSync(p) : Buffer.alloc(0)
      const buffer = (options?.packname || options?.author) ? await writeExifImg(buff, options) : await imageToWebp(buff)
      await sock.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
      return buffer
    }
  }

  if (!sock.sendVideoAsSticker) {
    sock.sendVideoAsSticker = async (jid, p, quoted, options = {}) => {
      const buff = Buffer.isBuffer(p) ? p : /^data:.*?\/.*?;base64,/i.test(p) ? Buffer.from(p.split`,`[1], 'base64') : /^https?:\/\//.test(p) ? await getBuffer(p) : fs.existsSync(p) ? fs.readFileSync(p) : Buffer.alloc(0)
      const buffer = (options?.packname || options?.author) ? await writeExifVid(buff, options) : await videoToWebp(buff)
      await sock.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
      return buffer
    }
  }

  if (!sock.copyNForward) {
    sock.copyNForward = async (jid, message, forceForward = false, options = {}) => {
      const content = generateForwardMessageContent(message, forceForward)
      return sock.sendMessage(jid, content, options)
    }
  }

  return msg
}

export {
  normalizeJid,
  resolveParticipantJid,
  resolveJidAsync,
  resolveLidsAsync,
  patchGroupMetadata,
  getAdminSet,
  isGroupAdmin,
  smsg,
  getBuffer,
  cleanNumber,
  BoundedMap
}

export default {
  normalizeJid,
  resolveParticipantJid,
  resolveJidAsync,
  resolveLidsAsync,
  patchGroupMetadata,
  getAdminSet,
  isGroupAdmin,
  smsg,
  getBuffer,
  cleanNumber,
  BoundedMap
}