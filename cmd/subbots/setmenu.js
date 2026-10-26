import { getSubConfig, saveSubConfig, getSub } from '../../lib/jadi.js'
import config from '../../config.js'
export const handler={}
handler.name='setmenu'
handler.alias=['tema','theme']
handler.category='subbots'
handler.owner = false
function getOwners(){return (config?.bot?.owner||[]).map(n=>n.toString().split('@')[0].replace(/\D/g,'')).filter(Boolean)}
function isMainOwner(m){let raw=m.key?.participant||m.key?.remoteJid||'';let c=raw.split('@')[0].split(':')[0].replace(/\D/g,'');if(m.key?.fromMe)return true;return getOwners().includes(c)||config.bot.owner.includes(raw)}
handler.exec=async(sock,m,args)=>{
 if(!sock.isSubBot && !isMainOwner(m)) return await sock.sendMessage(m.key.remoteJid, { text: '⚠️ Solo owners o el mismo bot pueden usar este comando' }, { quoted: m })
 const temas=['normal','pro','galactico','hallowen','electro','simple']
 const t=(args[0]||'').toLowerCase()
 let clean = (m.key?.participant || m.key?.remoteJid || '').split('@')[0].split(':')[0].replace(/\D/g,'')
 let targetNumber = sock.isSubBot ? sock.subNumber : clean
 if(!t || !temas.includes(t)){
 let cfg={}; try{ cfg=getSubConfig(targetNumber) }catch{ cfg={theme:'normal'} }
 return sock.sendMessage(m.key.remoteJid,{text:`*🎨 Temas:*\n${temas.map(x=>`• ${x}`).join('\n')}\n\nUso: .setmenu pro\nActual: *${cfg.theme||'normal'}*`},{quoted:m})
 }
 saveSubConfig(targetNumber, { theme: t })
 let sub=getSub(targetNumber)
 if(sub?.sock){ sub.sock.subConfig.theme=t }
 return sock.sendMessage(m.key.remoteJid,{text:`✅ Tema cambiado a *${t}*`},{quoted:m})
}
export default handler
