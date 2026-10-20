import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import config from './config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const commands = new Map()
global.plugins = commands
global.corruptedPlugins = []

const DB_PATH = './db/database.json'
const SETTINGS_PATH = './db/settings.json'
const GROUPS_PATH = './db/groups.json'
const PRIMARY_PATH = './db/primary.json'

if (!global.afkUsers) global.afkUsers = new Map()

let settingsCache = { mode: 'prefix', time: 0 }
let groupsCache = { data: {}, time: 0 }
let primaryCache = { data: {}, time: 0 }
let lastSave = 0

function cleanNumber(raw) {
 if (!raw) return ''
 let s = String(raw)
 if (s.includes('@')) s = s.split('@')[0]
 if (s.includes(':')) s = s.split(':')[0]
 return s.replace(/\D/g, '')
}

function normalizeJid(raw) {
 if (!raw) return ''
 const num = cleanNumber(raw)
 return num? num + '@s.whatsapp.net' : ''
}

function loadPrimary(){
 if(Date.now() - primaryCache.time < 5000) return primaryCache.data
 try{
 if(fs.existsSync(PRIMARY_PATH)){
 primaryCache = { data: JSON.parse(fs.readFileSync(PRIMARY_PATH,'utf-8')), time: Date.now() }
 } else {
 primaryCache = { data: {}, time: Date.now() }
 }
 }catch{ primaryCache = { data: {}, time: Date.now() } }
 return primaryCache.data
}

async function resolveJid(jid, sock, groupId) {
 if (!jid) return ''
 const clean = cleanNumber(jid)
 if (!jid.endsWith('@lid')) return clean
 try {
 if (groupId && sock?.groupMetadata) {
 const meta = await sock.groupMetadata(groupId)
 for (const p of meta?.participants || []) {
 const lidBase = p.lid?.split('@')[0]
 const idBase = p.id?.split('@')[0]
 if (lidBase === clean || idBase === clean) {
 if (p.phoneNumber) return cleanNumber(p.phoneNumber)
 if (p.id &&!p.id.endsWith('@lid')) return cleanNumber(p.id)
 }
 }
 }
 const lm = sock?.signalRepository?.lidMapping
 if (lm?.getPNForLID) {
 const pn = await Promise.race([
 lm.getPNForLID(jid),
 new Promise(r => setTimeout(() => r(null), 2000))
 ])
 if (pn) return cleanNumber(pn)
 }
 } catch {}
 return clean
}

function loadDB() {
 try {
 if (fs.existsSync(DB_PATH)) {
 let raw = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'))
 global.db = { data: raw.data || raw }
 } else {
 global.db = { data: { users: {}, codes: {}, chats: {}, settings: { prefixMode: 'prefix' } } }
 }
 } catch {
 global.db = { data: { users: {}, codes: {}, chats: {}, settings: { prefixMode: 'prefix' } } }
 }
 if (!global.db.data) global.db.data = { users: {}, codes: {}, chats: {}, settings: { prefixMode: 'prefix' } }
 if (!global.db.data.users) global.db.data.users = {}
 if (!global.db.data.codes) global.db.data.codes = {}
 if (!global.db.data.chats) global.db.data.chats = {}
 if (!global.db.data.settings) global.db.data.settings = { prefixMode: 'prefix' }
}

function saveDB(force = false) {
 if (!force && Date.now() - lastSave < 15000) return
 lastSave = Date.now()
 try { fs.writeFileSync(DB_PATH, JSON.stringify(global.db.data)) } catch {}
}

loadDB()
global.saveDB = () => saveDB(true)
setInterval(() => saveDB(true), 30000)

function getSettings() {
 if (Date.now() - settingsCache.time < 15000) return settingsCache.mode
 try {
 if (fs.existsSync(SETTINGS_PATH)) {
 let s = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8'))
 settingsCache = { mode: s.prefixMode || 'prefix', time: Date.now() }
 } else {
 settingsCache = { mode: global.db?.data?.settings?.prefixMode || 'prefix', time: Date.now() }
 }
 } catch { settingsCache = { mode: 'prefix', time: Date.now() } }
 return settingsCache.mode
}

function getGroups() {
 if (Date.now() - groupsCache.time < 20000) return groupsCache.data
 try {
 if (fs.existsSync(GROUPS_PATH)) groupsCache = { data: JSON.parse(fs.readFileSync(GROUPS_PATH, 'utf-8')), time: Date.now() }
 else groupsCache = { data: {}, time: Date.now() }
 } catch { groupsCache = { data: {}, time: Date.now() } }
 return groupsCache.data
}

function saveGroups(groups) {
 groupsCache = { data: groups, time: Date.now() }
 try { fs.writeFileSync(GROUPS_PATH, JSON.stringify(groups)) } catch {}
}

export async function loadPlugins() {
 commands.clear()
 global.corruptedPlugins = []
 const folder = path.join(__dirname, 'cmd')
 if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true })
 function getAllJsFiles(dir, fileList = []) {
 try{
 const files = fs.readdirSync(dir)
 for (const file of files) {
 const full = path.join(dir, file)
 try{
 const stat = fs.statSync(full)
 if (stat.isDirectory()) {
 getAllJsFiles(full, fileList)
 } else if (file.endsWith('.js')) {
 fileList.push(full)
 }
 }catch{}
 }
 }catch{}
 return fileList
 }
 const files = getAllJsFiles(folder).sort()
 let ok = 0, fail = 0
 let corrupted = []
 console.log(`───────────────────────────────────`)
 for (const fullPath of files) {
 const rel = path.relative(folder, fullPath)
 try {
 const mod = await import(pathToFileURL(fullPath).href + `?t=${Date.now()}`)
 const h = mod.default || mod.handler
 if (!h?.name ||!h?.exec) throw new Error('sin handler.name o handler.exec')
 commands.set(h.name.toLowerCase(), h)
 if (h.alias) for (const a of h.alias) commands.set(a.toLowerCase(), h)
 console.log(`🍭 Cargado › ${rel}`)
 ok++
 } catch (e) {
 console.log(`🏮 Error cmd › ${rel} - ${e.message}`)
 corrupted.push({ file: rel, error: e.message })
 fail++
 }
 }
 console.log(`───────────────────────────────────`)
 console.log(`✔ ${ok} comandos | ✖ ${fail} errores\n`)
 global.corruptedPlugins = corrupted
 return ok
}

export async function start() { return true }

function getContentType(message) {
 if (!message) return ''
 const keys = Object.keys(message)
 return keys.find(k => k.endsWith('Message')) || keys[0] || ''
}

function extractBody(message) {
 if (!message) return ''
 if (message.conversation) return message.conversation
 if (message.extendedTextMessage?.text) return message.extendedTextMessage.text
 if (message.imageMessage?.caption) return message.imageMessage.caption
 if (message.videoMessage?.caption) return message.videoMessage.caption
 if (message.buttonsResponseMessage?.selectedButtonId) return message.buttonsResponseMessage.selectedButtonId
 if (message.listResponseMessage?.singleSelectReply?.selectedRowId) return message.listResponseMessage.singleSelectReply.selectedRowId
 if (message.templateButtonReplyMessage?.selectedId) return message.templateButtonReplyMessage.selectedId
 if (message.interactiveResponseMessage) {
 let native = message.interactiveResponseMessage.nativeFlowResponseMessage
 if (native?.paramsJson) {
 try {
 let json = JSON.parse(native.paramsJson)
 if (json.id) return json.id
 if (json.params_v2) {
 try {
 let p2 = JSON.parse(json.params_v2)
 if (Array.isArray(p2) && p2[0]?.id) return p2[0].id
 } catch {}
 }
 } catch {}
 try {
 let j = JSON.parse(native.paramsJson)
 if (j.id) return j.id
 } catch {
 return native.paramsJson
 }
 }
 if (message.interactiveResponseMessage.body?.text) return message.interactiveResponseMessage.body.text
 }
 return ''
}

export async function handleMessages(sock, upsert) {
 try {
 if (upsert.type!== 'notify') return
 const msg = upsert.messages?.[0]
 if (!msg?.message) return
 const jid = msg.key.remoteJid
 if (!jid) return
 const isGroup = jid.endsWith('@g.us')
 const senderRaw = msg.key.participant || jid
 const senderClean = cleanNumber(senderRaw)
 const body = extractBody(msg.message)
 if (!body) return
 const pushName = msg.pushName || 'Usuario'
 const type = getContentType(msg.message)
 const senderResolved = await resolveJid(senderRaw, sock, isGroup? jid : null)
 const who = senderResolved || senderClean
 const where = isGroup? jid : 'privado'
 const preview = body.slice(0, 80) + (body.length > 80? '...' : '')
 console.log(`[${type}] ${pushName} (${who}) en ${where}: ${preview}`)

 const isAfkCmd = body.toLowerCase().startsWith('.afk')
 if (global.afkUsers.has(senderClean) &&!isAfkCmd) {
 global.afkUsers.delete(senderClean)
 try {
 await sock.sendMessage(jid, {
 text: `> @${senderClean} volvió`,
 mentions: [normalizeJid(senderClean)]
 }, { quoted: msg })
 } catch {}
 }

 // === FILTRO PRIMARY ===
 if(isGroup){
 const primaryData = loadPrimary()
 const primaryForGroup = primaryData[jid]
 if(primaryForGroup){
 // mi numero real
 const myNumber = cleanNumber(sock.user?.id || sock.principalNumber || sock.subNumber || sock.authState?.creds?.me?.id || '')
 const primaryClean = cleanNumber(primaryForGroup)
 if(myNumber && primaryClean){
 if(myNumber !== primaryClean){
 // si no soy el principal, me callo
 return
 }
 }
 }
 }

 let mode = getSettings()
 let args = [], cmdName = '', prefixUsed = null
 if (mode === 'no') {
 let split = body.trim().split(/ +/)
 cmdName = split.shift()?.toLowerCase()
 args = split
 if (!cmdName) return
 } else {
 const prefixes = [].concat(config.bot.prefix || ['.', '#', '/', '!'])
 prefixUsed = prefixes.find(p => body.startsWith(p))
 if (!prefixUsed) return
 args = body.slice(prefixUsed.length).trim().split(/ +/)
 cmdName = args.shift()?.toLowerCase()
 if (!cmdName) return
 }
 let groups = getGroups()
 if (isGroup) {
 if (groups[jid] === undefined) { groups[jid] = true; saveGroups(groups) }
 }
 const cmd = commands.get(cmdName)
 if (!cmd) return
 if (cmd.owner) {
 const participant = msg.key.participant || jid
 const botId = sock.user?.id || ''
 const isSelf = msg.key.fromMe || cleanNumber(participant) === cleanNumber(botId)
 const owners = [].concat(config.bot.owner || config.owner || [])
 const cleanOwnerList = owners.map(o => cleanNumber(o)).filter(Boolean)
 const isOwner = cleanOwnerList.includes(senderResolved) || cleanOwnerList.includes(senderClean)
 const isPrincipal = sock.isPrincipal ? true : false
 if (!isSelf &&!isOwner &&!isPrincipal) return
 }
 console.log(`[CMD] ${cmdName} de ${pushName} (${who}) en ${jid}`)
 let users = global.db.data.users
 let groupId = isGroup? jid : 'global'
 if (!users[groupId]) users[groupId] = {}
 const senderKey = senderResolved || senderClean
 if (!users[groupId][senderKey]) {
 users[groupId][senderKey] = { coins: 0, bank: 0, totalCommands: 0, commands: {}, exp: 0, harem: [], cmds: 0 }
 }
 let u = users[groupId][senderKey]
 if (!u.commands) u.commands = {}
 if (pushName) u.name = pushName
 u.totalCommands = (u.totalCommands || 0) + 1
 u.cmds = (u.cmds || 0) + 1
 u.commands[cmdName] = (u.commands[cmdName] || 0) + 1
 u.lastCmd = cmdName
 u.lastCmdTime = Date.now()
 u.exp = (u.exp || 0) + 10
 saveDB()
 await cmd.exec(sock, msg, args, {
 commands,
 groups,
 saveGroups: () => saveGroups(groups),
 groupsPath: GROUPS_PATH,
 db: global.db,
 users,
 saveDB: () => saveDB(true),
 sender: senderResolved || senderClean,
 senderJid: senderRaw,
 pushName,
 isGroup,
 jid,
 body,
 cleanNumber
 })
 } catch (e) {
 if (e?.output?.statusCode === 428) return
 console.log('[HANDLE]', e.message, e.stack)
 }
}
