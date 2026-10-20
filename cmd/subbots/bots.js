import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'

let getSubs = () => new Map()
let getPrincipals = () => new Map()
let botConfig = { bot: { name: 'Clover • Bot', prefix: '.' } }

try{
 let cfgPath = path.join(process.cwd(), 'config.js')
 if(fs.existsSync(cfgPath)){
 let mod = await import(pathToFileURL(cfgPath).href)
 botConfig = mod.default || mod.config || botConfig
 }
}catch{}

for (const p of [path.join(process.cwd(), 'lib', 'jadibot.js')]) {
 if (fs.existsSync(p)) {
 try { const mod = await import(pathToFileURL(p).href); getSubs = mod.getSubs || (()=>new Map()) } catch {}
 }
}
for (const p of [path.join(process.cwd(), 'lib', 'principals.js')]) {
 if (fs.existsSync(p)) {
 try { const mod = await import(pathToFileURL(p).href); getPrincipals = mod.getPrincipals || (()=>new Map()) } catch {}
 }
}

export const handler = {}
handler.name = 'bots'
handler.alias = ['subbots','listbots']
handler.category = 'socket'

function censurarMedio(num=''){
 let n = String(num).replace(/\D/g,'')
 if(n.length <= 7) return `+${n.slice(0,2)}•••${n.slice(-2)}`
 return `+${n.slice(0,3)}${'•'.repeat(n.length-7)}${n.slice(-4)}`
}

function formatUptime(ms){
 if(!ms) return '—'
 let s = Math.floor(ms/1000)
 let h = Math.floor(s/3600), m=Math.floor((s%3600)/60)
 return h>0 ? `${h}h ${m}m` : `${m}m ${s%60}s`
}

handler.exec = async (sock, m) => {
 const jid = m.key.remoteJid
 const prefixMain = botConfig.bot?.prefix?.[0] || botConfig.prefix || '.'
 const botNameReal = botConfig.bot?.name || botConfig.bot?.botName || 'Clover • Main'
 
 try{
 const mainId = sock.user?.id || ''
 const mainNum = mainId.split(':')[0].replace(/\D/g,'') || ''
 const mainJidForMention = mainId.includes('@') ? mainId : `${mainNum}@s.whatsapp.net`

 let subsMap = new Map()
 try{ let s=getSubs(); if(s?.size) subsMap=s }catch{}
 let princMap = new Map()
 try{ let p=getPrincipals(); if(p?.size) princMap=p }catch{}

 // Principals desde disco
 let princDisk = []
 const princPath = path.join(process.cwd(),'principals')
 if(fs.existsSync(princPath)){
 princDisk = fs.readdirSync(princPath).filter(d=>{ try{ return fs.statSync(path.join(princPath,d)).isDirectory() && /^\d+$/.test(d) }catch{return false} })
 }
 // SubBots desde disco
 let subDisk = []
 const basePath = path.join(process.cwd(),'jadiBots')
 if(fs.existsSync(basePath)){
 subDisk = fs.readdirSync(basePath).filter(d=>{ try{ return fs.statSync(path.join(basePath,d)).isDirectory() && /^\d+$/.test(d) }catch{return false} })
 }

 const allPrincs = [...new Set([...princMap.keys(), ...princDisk])]
 const allSubs = [...new Set([...subsMap.keys(), ...subDisk])]
 const total = 1 + allPrincs.length + allSubs.length

 let mentions = [mainJidForMention]
 let txt = ``
 txt += `╭─╼━─╾─╼━─╾─╼━─╾╮\n`
 txt += `│ ⛩️ 𝐁𝐎𝐓𝐒 𝐒𝐘𝐒𝐓𝐄𝐌\n`
 txt += `│ 〄 Activos: ${total}\n`
 txt += `╰─╼━─╾─╼━─╾─╼━─╾╯\n\n`

 // MAIN - CON NOMBRE REAL DEL CONFIG + MENCION
 txt += `┏━━━「 💎 𝐏𝐑𝐈𝐍𝐂𝐈𝐏𝐀𝐋 𝐌𝐀𝐈𝐍 」━━━┓\n`
 txt += `┃ ⛩️ Bot: ${botNameReal}\n`
 txt += `┃ 👑 Mención: @${mainNum}\n`
 txt += `┃ 🜲 Número: ${censurarMedio(mainNum)}\n`
 txt += `┃ ⚙️ Prefijo: ${prefixMain}code\n`
 txt += `┃ ⏤ Uptime: ${formatUptime(process.uptime()*1000)}\n`
 txt += `┃ 🜸 Estado: 🟢 Online\n`
 txt += `┗━━━━━━━━━━━━━━━━━━━┛\n\n`

 // PRINCIPALES
 txt += `┏━━━「 👑 𝐏𝐑𝐈𝐍𝐂𝐈𝐏𝐀𝐋𝐄𝐒 [${allPrincs.length}] 」━━━┓\n`
 if(allPrincs.length===0){
 txt += `┃ 〄 Sin principals\n`
 }else{
 for(let num of allPrincs){
 let data = princMap.get(num)
 let online = !!data?.sock?.user
 if(online && data.sock.user.id) mentions.push(data.sock.user.id)
 mentions.push(`${num}@s.whatsapp.net`)
 // Nombre real del principal desde su config.json
 let realName = botNameReal
 try{
 let cfgFile = path.join(process.cwd(),'principals',num,'config.json')
 if(fs.existsSync(cfgFile)){
 let jj = JSON.parse(fs.readFileSync(cfgFile,'utf8'))
 realName = jj.bot?.name || jj.name || realName
 }
 }catch{}
 if(data?.sock?.user?.name && data.sock.user.name !== '𐚁 asistente') realName = data.sock.user.name
 
 txt += `┃\n`
 txt += `┃ ⛩️ ${realName}\n`
 txt += `┃ 👑 @${num}\n`
 txt += `┃ 🜲 ${censurarMedio(num)}\n`
 txt += `┃ ${online ? '🟢 Online' : '🟡 En disco'} • Principal\n`
 }
 }
 txt += `┗━━━━━━━━━━━━━━━━━━━┛\n\n`

 // SUB-BOTS
 txt += `┏━━━「 🎃 𝐒𝐔𝐁-𝐁𝐎𝐓𝐒 [${allSubs.length}] 」━━━┓\n`
 if(allSubs.length===0){
 txt += `┃ 〄 Sin sub-bots\n`
 }else{
 for(let num of allSubs){
 let data = subsMap.get(num)
 if(data?.sock?.user?.id) mentions.push(data.sock.user.id)
 mentions.push(`${num}@s.whatsapp.net`)
 let name = data?.name || data?.sock?.user?.name || botNameReal
 // Si es nombre generico de WhatsApp, usa el del bot
 if(name.includes('asistente') || name.length < 3) name = `${botNameReal} • Sub`
 let up = data?.uptime ? formatUptime(Date.now()-data.uptime) : '—'
 
 txt += `┃\n`
 txt += `┃ 🍀 ${name}\n`
 txt += `┃ 👑 @${num}\n`
 txt += `┃ 🜲 ${censurarMedio(num)}\n`
 txt += `┃ ⏤ ${up} | ⚙️ ${prefixMain}\n`
 }
 }
 txt += `┗━━━━━━━━━━━━━━━━━━━┛\n\n`
 txt += `⌬ Anti-spam: sin links wa.me`

 mentions = [...new Set(mentions)].filter(j=> j && j.includes('@') && !j.includes('XXX'))
 await sock.sendMessage(jid, { text: txt.trim(), mentions }, { quoted: m })

 }catch(e){
 console.log('[BOTS ERROR]', e)
 await sock.sendMessage(jid, { text: `❌ ${e.message}` }, { quoted: m })
 }
}
