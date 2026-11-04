import fs from 'fs'
import path from 'path'

export const handler = {}
handler.name = 'setname'
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
 // merge: conserva banner, theme, prefix, etc
 let merged = {...existing, ...data, name: data.name, botName: data.name}
 fs.writeFileSync(p, JSON.stringify(merged, null, 2))
 }catch{}
 }
}

handler.exec = async (sock, m, args) => {
 const jid = m.key.remoteJid
 const text = args.join(' ').trim()
 if(!text) return sock.sendMessage(jid, {text:'❌ Usa: .setname Nuevo Nombre'}, {quoted:m})
 
 let num = sock?.user?.id?.split(':')[0]?.split('@')[0]?.replace(/\D/g,'') || sock.subNumber || sock.principalNumber
 if(!num) num = (sock?.user?.id || '').replace(/\D/g,'')
 if(!num) return sock.sendMessage(jid, {text:'❌ No detecté tu número'}, {quoted:m})

 saveAll(num, { name: text })

 if(sock.subConfig) sock.subConfig.name = text
 if(sock.principalConfig) { sock.principalConfig.name = text; sock.principalConfig.botName = text }

 await sock.sendMessage(jid, {text:`✅ Ahora te llamas *${text}*\nGuardado en principals + subbots`}, {quoted:m})
}
export default handler
