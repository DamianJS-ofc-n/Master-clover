import config from '../../config.js'
import util from 'util'
export const handler = {}
handler.name = 'eval'
handler.alias = ['ev', 'execjs']
handler.category = 'owner'
handler.description = 'Ejecuta código JS (solo owner)'
handler.owner = true

function getOwners(){return (config?.bot?.owner||[]).map(n=>n.toString().split('@')[0].replace(/\D/g,'')).filter(Boolean)}
function isOwnerDirect(m){let raw=m.key?.participant||m.key?.remoteJid||'';let clean=raw.split('@')[0].split(':')[0].replace(/\D/g,'');if(m.key?.fromMe)return true;return getOwners().includes(clean)||config.bot.owner.includes(raw)}
function split(t,n=3800){let r=[];for(let i=0;i<t.length;i+=n)r.push(t.slice(i,i+n));return r}

handler.exec = async (sock, m, args, extra) => {
 if(!isOwnerDirect(m)) return await sock.sendMessage(m.key.remoteJid, { text: '⚠️ Solo owners pueden usar esto.' }, { quoted: m })
 const jid = m.key.remoteJid
 if (!args.args?.length && !args.length) return await sock.sendMessage(jid, { text: `Uso: .eval config.bot.name` }, { quoted: m })
 let code = (args.args || args).join(' ')
 try {
 const conn = sock; const db = global.db; const m2 = m
 let result = await eval(code)
 if (typeof result!== 'string') result = util.inspect(result, { depth: 3 })
 if(result.length <= 3800) return await sock.sendMessage(jid, { text: `*EVAL - Resultado:*\n\n\`\`\`js\n${result}\n\`\`\`` }, { quoted: m })
 let parts = split(result)
 await sock.sendMessage(jid, { text: `*EVAL - Resultado completo (${parts.length} partes)*` }, { quoted: m })
 for(let i=0;i<parts.length;i++){await sock.sendMessage(jid, { text: `*Parte ${i+1}/${parts.length}:*\n\`\`\`js\n${parts[i]}\n\`\`\`` }, { quoted: m }); await new Promise(r=>setTimeout(r,400))}
 } catch (e) {
 let err = e.message.toString()
 let parts = split(err)
 for(let p of parts) await sock.sendMessage(jid, { text: `*EVAL - Error:*\n\`\`\`js\n${p}\n\`\`\`` }, { quoted: m })
 }
}
export default handler
