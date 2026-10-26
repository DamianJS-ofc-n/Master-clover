import config from '../../config.js'
import fs from 'fs'
import path from 'path'
export const handler = {}
handler.name = 'setcmd'
handler.alias = ['setcommand']
handler.category = 'owner'
handler.owner = true
function getOwners(){return (config?.bot?.owner||[]).map(n=>n.toString().split('@')[0].replace(/\D/g,'')).filter(Boolean)}
function isOwnerDirect(m){let raw=m.key?.participant||m.key?.remoteJid||'';let c=raw.split('@')[0].split(':')[0].replace(/\D/g,'');if(m.key?.fromMe)return true;return getOwners().includes(c)||config.bot.owner.includes(raw)}
handler.exec = async (sock, m, args) => {
 if(!isOwnerDirect(m)) return await sock.sendMessage(m.key.remoteJid, { text: '⚠️ Solo owners pueden usar esto.' }, { quoted: m })
 const jid=m.key.remoteJid
 if(args.length<2) return await sock.sendMessage(jid, { text: `Uso: .setcmd nombre codigo\nEj: .setcmd hola console.log("hola")` }, { quoted: m })
 let name=args[0].replace(/[^a-z0-9]/gi,'')
 let code=args.slice(1).join(' ')
 let filePath=path.join(process.cwd(),'cmd','custom',`${name}.js`)
 if(!fs.existsSync(path.join(process.cwd(),'cmd','custom'))) fs.mkdirSync(path.join(process.cwd(),'cmd','custom'),{recursive:true})
 let template=`import config from '../../config.js'\nexport const handler={}\nhandler.name='${name}'\nhandler.exec=async(sock,m)=>{\n${code}\n}\nexport default handler\n`
 fs.writeFileSync(filePath, template)
 await sock.sendMessage(jid, { text: `✅ Comando .${name} creado` }, { quoted: m })
}
export default handler
