import config from '../../config.js'
import { createPrincipalBot, getPrincipals, removePrincipal } from '../../lib/principals.js'
import fs from 'fs'
import path from 'path'
export const handler = {}
handler.name = 'codemod'
handler.alias = ['addprincipal','modcode','addmod']
handler.category = 'owner'
handler.owner = true
const clean = (n='') => String(n).replace(/\D/g,'')
function getOwners(){return (config?.bot?.owner||[]).map(n=>n.toString().split('@')[0].replace(/\D/g,'')).filter(Boolean)}
function isOwnerDirect(m){let raw=m.key?.participant||m.key?.remoteJid||'';let c=raw.split('@')[0].split(':')[0].replace(/\D/g,'');if(m.key?.fromMe)return true;return getOwners().includes(c)||config.bot.owner.includes(raw)}
handler.exec = async (...args) => {
 let sock, m, a
 if (args[0]?.key) { m = args[0]; sock = args[1]?.conn || global.conn; a = args[1]?.args || [] }
 else { sock = args[0]; m = args[1]; a = args[2] || [] }
 if(!isOwnerDirect(m)) return await sock.sendMessage(m.key.remoteJid, { text: '⚠️ Solo owners pueden usar esto.' }, { quoted: m })
 const from = m.key.remoteJid
 const subCmd = (a[0]||'').toLowerCase()
 if(subCmd === 'list'){
 const root = path.join(process.cwd(),'principals')
 if(!fs.existsSync(root)) return await sock.sendMessage(from,{text:'No hay principals'},{quoted:m})
 let dirs = fs.readdirSync(root).filter(d=>fs.statSync(path.join(root,d)).isDirectory())
 if(!dirs.length) return await sock.sendMessage(from,{text:'No hay principals'},{quoted:m})
 let txt = `*PRINCIPALS CONECTADOS:* ${dirs.length}\n\n`; for(let d of dirs) txt += `• +${d}\n`
 return await sock.sendMessage(from,{text:txt},{quoted:m})
 }
 if(subCmd === 'del' || subCmd === 'remove'){
 const num = clean(a[1]||'')
 if(!num) return await sock.sendMessage(from,{text:`Uso: ${config.bot?.prefix||'.'}codemod del 5199999999`},{quoted:m})
 removePrincipal(num); return await sock.sendMessage(from,{text:`✅ Principal +${num} eliminado`},{quoted:m})
 }
 const number = clean(a[0] || '')
 if(!number){ return await sock.sendMessage(from,{text:`*Uso:*\n${config.bot?.prefix||'.'}codemod 51999999999\n${config.bot?.prefix||'.'}codemod list\n${config.bot?.prefix||'.'}codemod del 5199`},{quoted:m})}
 const dir = path.join(process.cwd(),'principals',number)
 if(fs.existsSync(path.join(dir,'creds.json'))){
 try{ const creds = JSON.parse(fs.readFileSync(path.join(dir,'creds.json'),'utf8')); if(creds.registered){ return await sock.sendMessage(from,{text:`✅ +${number} ya es principal y está registrado, reconectando...`},{quoted:m})}}catch{}
 }
 await sock.sendMessage(from,{text:`⏳ Generando código PRINCIPAL para +${number}...`},{quoted:m})
 try{
 await createPrincipalBot(number, {
 onCode: async (code) => { await sock.sendMessage(from,{text:`*CÓDIGO PRINCIPAL +${number}:*\n\n\`${code}\`\n\n📲 WhatsApp > Dispositivos vinculados > Vincular con número`},{quoted:m})},
 onConnected: async () => { await sock.sendMessage(from,{text:`✅ PRINCIPAL +${number} CONECTADO`},{quoted:m})},
 })
 }catch(e){ await sock.sendMessage(from,{text:`❌ ${e.message}`},{quoted:m})}
}
export default handler
