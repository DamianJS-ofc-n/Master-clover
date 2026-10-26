import fs from 'fs'
import path from 'path'

export const handler = {}
handler.name = 'setbanner'
handler.category = 'subbots'

function getRealPath(num){
 const p1 = path.join(process.cwd(), 'subbots', num, 'config.json')
 const p2 = path.join(process.cwd(), 'jadiBots', num, 'config.json')
 const p3 = path.join(process.cwd(), 'principals', num, 'config.json')
 if(fs.existsSync(p1)) return p1
 if(fs.existsSync(p2)) return p2
 if(fs.existsSync(p3)) return p3
 return p1
}

handler.exec = async (sock, m, args) => {
 const jid = m.key.remoteJid
 let url = args[0]?.trim()
 let buffer = null

 try{
 if(m.message?.imageMessage){
 const {downloadMediaMessage} = await import('@whiskeysockets/baileys')
 buffer = await downloadMediaMessage(m, 'buffer', {})
 } else if(m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage){
 const {downloadMediaMessage} = await import('@whiskeysockets/baileys')
 const qmsg = m.message.extendedTextMessage.contextInfo.quotedMessage
 const q = { message: qmsg, key: { remoteJid: jid, id: m.message.extendedTextMessage.contextInfo.stanzaId } }
 buffer = await downloadMediaMessage(q, 'buffer', {})
 }
 }catch(e){ console.log(e) }

 let bannerToSave = url || ''
 if(buffer){
 const dir = path.join(process.cwd(), 'db')
 if(!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive:true})
 let num = sock?.user?.id?.split(':')[0]?.replace(/\D/g,'') || sock.subNumber || 'main'
 const filePath = path.join(dir, `banner_${num}.jpg`)
 fs.writeFileSync(filePath, buffer)
 bannerToSave = filePath
 }

 if(!bannerToSave) return sock.sendMessage(jid, {text:'❌ Usa .setbanner <link> o responde a una foto'}, {quoted:m})

 let num = sock?.user?.id?.split(':')[0]?.replace(/\D/g,'') || sock.subNumber || sock.principalNumber
 const cfgPath = getRealPath(num)
 const dir = path.dirname(cfgPath)
 if(!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive:true})
 
 let data = { name: 'Bot', banner: '', theme: 'normal' }
 if(fs.existsSync(cfgPath)){
 try{ data = JSON.parse(fs.readFileSync(cfgPath,'utf8')) }catch{}
 }
 data.banner = bannerToSave
 fs.writeFileSync(cfgPath, JSON.stringify(data, null, 2))

 if(sock.subConfig) sock.subConfig.banner = bannerToSave
 if(sock.principalConfig) sock.principalConfig.banner = bannerToSave

 await sock.sendMessage(jid, {text:`✅ Banner cambiado`}, {quoted:m})
}
export default handler
