import { getSub } from '../../lib/jadi.js'
import config from '../../config.js'
export const handler = {}
handler.name = 'setpfp'
handler.alias = ['setpp']
handler.category = 'subbots'
handler.owner = false
function getOwners(){return (config?.bot?.owner||[]).map(n=>n.toString().split('@')[0].replace(/\D/g,'')).filter(Boolean)}
function isMainOwner(m){let raw=m.key?.participant||m.key?.remoteJid||'';let c=raw.split('@')[0].split(':')[0].replace(/\D/g,'');if(m.key?.fromMe)return true;return getOwners().includes(c)||config.bot.owner.includes(raw)}
handler.exec = async (sock, m) => {
 if(!sock.isSubBot && !isMainOwner(m)) return await sock.sendMessage(m.key.remoteJid, { text: '⚠️ Solo owners o el mismo bot pueden usar este comando' }, { quoted: m })
 let jid = m.key.remoteJid
 let clean = (m.key?.participant || jid || '').split('@')[0].split(':')[0].replace(/\D/g,'')
 let targetNumber = sock.isSubBot ? sock.subNumber : clean
 let sub = getSub(targetNumber)
 let targetSock = sub?.sock || sock
 let quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage || m.message?.imageMessage
 if(!quoted) return await sock.sendMessage(jid, { text: `Responde a una imagen con .setpfp` }, { quoted: m })
 try{
 const { downloadMediaMessage } = await import('@whiskeysockets/baileys')
 let buffer = await downloadMediaMessage(m, 'buffer', {}, { logger: undefined, reuploadRequest: targetSock.updateMediaMessage })
 await targetSock.updateProfilePicture(targetSock.user.id, buffer)
 await sock.sendMessage(jid, { text: `✅ Foto cambiada para +${targetNumber}` }, { quoted: m })
 }catch(e){ await sock.sendMessage(jid, { text: `❌ Error: ${e.message}` }, { quoted: m }) }
}
export default handler
