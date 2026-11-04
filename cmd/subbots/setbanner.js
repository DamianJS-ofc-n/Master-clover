import fs from 'fs'
import path from 'path'

export const handler = {}
handler.name = 'setbanner'
handler.category = 'subbots'

function saveAll(num, data){
 const paths = [
 path.join(process.cwd(), 'principals', num, 'config.json'),
 path.join(process.cwd(), 'subbots', num, 'config.json'),
 path.join(process.cwd(), 'jadiBots', num, 'config.json')
 ]
 for(let p of paths){
 try{
 let dir = path.dirname(p)
 if(!fs.existsSync(dir)) fs.mkdirSync(dir,{recursive:true})
 let existing = {}
 if(fs.existsSync(p)){
 try{ existing = JSON.parse(fs.readFileSync(p,'utf8')) }catch{}
 }
 let merged = {...existing, ...data}
 fs.writeFileSync(p, JSON.stringify(merged, null, 2))
 }catch{}
 }
}

handler.exec = async (sock, m, args) => {
 const jid = m.key.remoteJid
 let url = args[0]?.trim()
 let buffer = null

 try{
 if(m.message?.imageMessage){
 const {downloadMediaMessage} = await import('WhiskeySockets-locosyasociados')
 buffer = await downloadMediaMessage(m, 'buffer', {})
 } else if(m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage){
 const {downloadMediaMessage} = await import('WhiskeySockets-locosyasociados')
 const qmsg = m.message.extendedTextMessage.contextInfo.quotedMessage
 const q = { message: qmsg, key: { remoteJid: jid, id: m.message.extendedTextMessage.contextInfo.stanzaId } }
 buffer = await downloadMediaMessage(q, 'buffer', {})
 }
 }catch(e){ console.log(e) }

 let bannerToSave = url || ''
 if(buffer){
 const dir = path.join(process.cwd(), 'db')
 if(!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive:true})
 let num = sock?.user?.id?.split(':')[0]?.split('@')[0]?.replace(/\D/g,'') || sock.subNumber || 'main'
 const filePath = path.join(dir, `banner_${num}.jpg`)
 fs.writeFileSync(filePath, buffer)
 bannerToSave = filePath
 }

 if(!bannerToSave) return sock.sendMessage(jid, {text:'❌ Usa .setbanner <link> o responde a una foto'}, {quoted:m})

 let num = sock?.user?.id?.split(':')[0]?.split('@')[0]?.replace(/\D/g,'') || sock.subNumber || sock.principalNumber
 if(!num) num = (sock?.user?.id || '').replace(/\D/g,'')

 saveAll(num, { banner: bannerToSave })

 if(sock.subConfig) sock.subConfig.banner = bannerToSave
 if(sock.principalConfig) sock.principalConfig.banner = bannerToSave

 await sock.sendMessage(jid, {text:`✅ Banner cambiado y guardado en principals + subbots`}, {quoted:m})
}
export default handler
