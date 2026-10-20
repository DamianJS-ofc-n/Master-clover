import os from 'os'
import fs from 'fs'
import { execSync } from 'child_process'
import { pathToFileURL } from 'url'
import path from 'path'

export const handler = {}
handler.name = 'ping'
handler.alias = ['p']
handler.category = 'general'

function formatBytes(b){
 if(b===0) return '0 B'
 const k=1024
 const sizes=['B','KB','MB','GB']
 const i=Math.floor(Math.log(b)/Math.log(k))
 return parseFloat((b/Math.pow(k,i)).toFixed(1))+' '+sizes[i]
}
function uptime(t){
 const d=Math.floor(t/86400)
 const h=Math.floor(t%86400/3600)
 const m=Math.floor(t%3600/60)
 return `${d>0?d+'d ':''}${h}h ${m}m`.trim() || '0m'
}

let botName = 'Clover Bot'
try{
 const cfgPath = path.join(process.cwd(),'config.js')
 if(fs.existsSync(cfgPath)){
 const mod = await import(pathToFileURL(cfgPath).href)
 const cfg = mod.default || mod.config || {}
 botName = cfg.bot?.name || cfg.bot?.botName || botName
 }
}catch{}

handler.exec = async (sock, m) => {
 const jid = m.key.remoteJid
 const start = Date.now()
 const sent = await sock.sendMessage(jid, { text: `🖥️ Calculando...` }, { quoted: m })
 const latency = Date.now() - start

 const host = os.hostname()
 const platform = os.platform() === 'linux' ? 'Linux' : os.platform()
 const botUptime = uptime(process.uptime())

 const totalMem = os.totalmem()
 const freeMem = os.freemem()
 const usedMem = totalMem - freeMem

 const cpus = os.cpus()
 const cpuModel = cpus[0]?.model?.split(' ').slice(0,3).join(' ') || 'Unknown'
 const cores = cpus.length
 const load = os.loadavg()[0].toFixed(2)
 const memUsage = ((usedMem/totalMem)*100).toFixed(0)

 let usersCount = 0
 try{
 if(fs.existsSync('./db/database.json')){
 let db = JSON.parse(fs.readFileSync('./db/database.json','utf-8'))
 let data = db.data || db
 if(data.allUsers) usersCount = Object.keys(data.allUsers).length
 else if(data.users){
 let s = new Set()
 for(let g in data.users) for(let u in data.users[g]) s.add(u)
 usersCount = s.size
 }
 }
 }catch{}

 let diskUsed='N/A', diskTotal='N/A', diskFree='N/A'
 try{
 const df = execSync('df -k / | tail -1').toString().trim().split(/\s+/)
 diskTotal = formatBytes(parseInt(df[1])*1024)
 diskUsed = formatBytes(parseInt(df[2])*1024)
 diskFree = formatBytes(parseInt(df[3])*1024)
 }catch{}

 const text = `🖥️ *Estado del bot*
🏷️ Host: *${host}*
🧩 SO: *${platform}*
🟢 Uptime: *${botUptime}*
📡 Ping: *${latency}ms*
────────────────
🧠 *RAM*
• Total: *${formatBytes(totalMem)}*
• Usada: *${formatBytes(usedMem)}*
• Libre: *${formatBytes(freeMem)}*
────────────────
ℹ️ *INFO BOT*
• Usuarios: *${usersCount}*
• Bot: *${botName}*
────────────────
⚙️ *CPU*
• Modelo: *${cpuModel}*
• Núcleos: *${cores}*
• Carga: *${load}*
• Uso aprox: *${memUsage}%*
────────────────
💾 *Discos (df)*
• Total: *${diskTotal}*
• Usado: *${diskUsed}*
• Libre: *${diskFree}*`.trim()

 await sock.sendMessage(jid, { text, edit: sent.key })
}
