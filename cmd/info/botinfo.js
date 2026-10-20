import fs from 'fs'
import path from 'path'
import os from 'os'
import config from '../../config.js'

export const handler = {}
handler.name = 'botinfo'
handler.alias = ['info', 'infobot']
handler.category = 'info'

function getPlatform() {
 try {
 if (fs.existsSync('/data/data/com.termux') || process.env.TERMUX_VERSION) return 'android'
 } catch {}
 return os.platform()
}

function isSubBotCheck(sock) {
 try {
 const botId = (sock.user?.id || '').replace(/[^0-9]/g, '').slice(0,20)
 if (!botId) return false
 // 1. Carpeta JadiBots
 if (fs.existsSync(`./JadiBots/${botId}`)) return true
 // 2. Esta en global.conns (si el principal lo guarda)
 if (global.conns?.length && global.conns.find(c => c.user?.id?.includes(botId))) return true
 // 3. No coincide con el numero del owner principal del config
 const mainNumber = (config.bot?.number || config.owner?.[0]?.[0] || '').toString().replace(/[^0-9]/g,'')
 if (mainNumber && botId !== mainNumber && !botId.includes(mainNumber)) return true
 } catch {}
 return false
}

async function getImageBuffer(p) {
 if (!p) return null
 try {
 if (p.startsWith('http://') || p.startsWith('https://')) {
 const res = await fetch(p)
 if (!res.ok) return null
 return Buffer.from(await res.arrayBuffer())
 } else {
 const abs = path.resolve(p)
 if (fs.existsSync(abs)) return fs.readFileSync(abs)
 }
 } catch {}
 return null
}

handler.exec = async (sock, m) => {
 let start = Date.now()
 try {
 let jid = m.key.remoteJid
 let uptime = process.uptime()
 let horas = Math.floor(uptime / 3600)
 let minutos = Math.floor((uptime % 3600) / 60)
 let activo = `${horas}h ${minutos}m`
 
 let tipoReal = isSubBotCheck(sock) ? 'Sub-bot' : 'Principal'
 let botName = config.bot?.name || config.botName || 'Kitsune'
 let moneda = config.economy?.coin || 'Coins'
 let prefijos = Array.isArray(config.bot?.prefix) ? config.bot.prefix.join(', ') : (config.bot?.prefix || '.')
 let link = config.channels?.Web || ''
 let channelId = config.channels?.id || ''
 let channelName = config.channels?.cname || 'KITSUNE-MD'
 let nodeV = process.version
 let usuarios = 0
 try { if (global.db?.data?.users) usuarios = Object.keys(global.db.data.users).length } catch {}
 let ping = Date.now() - start

 let text = `✐ Información del bot *${botName}*\n\n`
 text += `> ✿ *Nombre ›* ${botName}\n`
 text += `> ✦ *Moneda ›* ${moneda}\n`
 text += `> ✦ *Prefijo's ›* \`${prefijos}\`\n`
 text += `> ❖ *Ping ›* ${ping}ms\n`
 text += `> ✐ *Usuarios ›* ${usuarios}\n\n`
 text += `> ★ *Tipo ›* ${tipoReal}\n`
 text += `> ❒ *Plataforma ›* ${getPlatform()}\n`
 text += `> ❒ *NodeJS ›* ${nodeV}\n`
 text += `> ❒ *Activo ›* ${activo}\n`
 text += `> ❒ *Dev ›* DamianJS-ofc`
 if (link) text += `\n\n> ${link}`

 // Busca foto - soporta link y local
 let imgBuffer = null
 const fotosTry = [
 './db/fotos/icon.jpg',
 './db/fotos/banner.jpg',
 config.bot?.foto,
 config.bot?.logo,
 config.foto
 ]
 for (let p of fotosTry) {
 imgBuffer = await getImageBuffer(p)
 if (imgBuffer) break
 }

 const ctx = {
 forwardingScore: 999,
 isForwarded: true,
 forwardedNewsletterMessageInfo: {
 newsletterJid: channelId,
 newsletterName: channelName,
 serverMessageId: -1
 }
 }

 if (imgBuffer) {
 await sock.sendMessage(jid, { image: imgBuffer, caption: text, contextInfo: ctx }, { quoted: m })
 } else {
 await sock.sendMessage(jid, { text, contextInfo: ctx }, { quoted: m })
 }
 } catch (e) {
 console.log('[BOTINFO]', e)
 }
}
