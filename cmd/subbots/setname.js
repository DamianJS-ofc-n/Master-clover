import fs from 'fs'
import path from 'path'

export const handler = {}
handler.name = 'setname'
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
 const text = args.join(' ').trim()
 if(!text) return sock.sendMessage(jid, {text:'❌ Usa: .setname Nuevo Nombre'}, {quoted:m})
 
 let num = sock?.user?.id?.split(':')[0]?.replace(/\D/g,'') || sock.subNumber || sock.principalNumber
 if(!num) return sock.sendMessage(jid, {text:'❌ No detecté tu número'}, {quoted:m})

 const cfgPath = getRealPath(num)
 const dir = path.dirname(cfgPath)
 if(!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive:true})
 
 let data = { name: 'Bot', banner: '', theme: 'normal' }
 if(fs.existsSync(cfgPath)){
 try{ data = JSON.parse(fs.readFileSync(cfgPath,'utf8')) }catch{}
 }
 data.name = text
 fs.writeFileSync(cfgPath, JSON.stringify(data, null, 2))

 if(sock.subConfig) sock.subConfig.name = text
 if(sock.principalConfig) sock.principalConfig.name = text

 await sock.sendMessage(jid, {text:`✅ Ahora te llamas *${text}*\nBanner conservado: ${data.banner ? 'sí' : 'no'}\nUsa .menu`}, {quoted:m})
}
export default handler
