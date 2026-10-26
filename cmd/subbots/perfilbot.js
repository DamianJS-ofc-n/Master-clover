import { getSubConfig, getSub } from '../../lib/jadi.js'
import config from '../../config.js'
export const handler = {}
handler.name = 'perfilbot'
handler.alias = ['mybot']
handler.category = 'subbots'
handler.owner = false
function getOwners(){return (config?.bot?.owner||[]).map(n=>n.toString().split('@')[0].replace(/\D/g,'')).filter(Boolean)}
function isMainOwner(m){let raw=m.key?.participant||m.key?.remoteJid||'';let c=raw.split('@')[0].split(':')[0].replace(/\D/g,'');if(m.key?.fromMe)return true;return getOwners().includes(c)||config.bot.owner.includes(raw)}
handler.exec = async (sock, m) => {
 if(!sock.isSubBot && !isMainOwner(m)) return await sock.sendMessage(m.key.remoteJid, { text: '⚠️ Solo owners o el mismo bot pueden usar este comando' }, { quoted: m })
 let clean = (m.key?.participant || m.key?.remoteJid || '').split('@')[0].split(':')[0].replace(/\D/g,'')
 let targetNumber = sock.isSubBot ? sock.subNumber : clean
 let cfg={}; try{ cfg=getSubConfig(targetNumber) }catch{ cfg={name:'Default',theme:'normal'} }
 let sub = getSub(targetNumber)
 let status = sub?.sock?.user ? '🟢 Conectado' : '🔴 Off'
 let txt = `*🤖 Tu Bot +${targetNumber}*\n\n📛 ${cfg.name}\n🎨 ${cfg.theme}\n📡 ${status}`
 await sock.sendMessage(m.key.remoteJid, { text: txt }, { quoted: m })
}
export default handler
