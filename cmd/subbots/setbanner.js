import fs from 'fs'
import path from 'path'
import { saveSubConfig, getSubs } from '../../lib/jadi.js'
import { savePrincipalConfig, getPrincipals } from '../../lib/principals.js'

export const handler = {}
handler.name = 'setbanner'
handler.category = 'subbots'

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
 let numTmp = sock.principalNumber || sock.subNumber || sock?.user?.id?.split(':')[0]?.replace(/\D/g,'') || 'main'
 const filePath = path.join(dir, `banner_${numTmp}.jpg`)
 fs.writeFileSync(filePath, buffer)
 bannerToSave = filePath
 }
 if(!bannerToSave) return sock.sendMessage(jid, {text:'❌ Usa .setbanner <link> o responde a una foto'}, {quoted:m})

 let num = sock.principalNumber || sock.subNumber || sock?.user?.id?.split(':')[0]?.split('@')[0]?.replace(/\D/g,'') || ''
 num = String(num).replace(/\D/g,'')

 if(sock.isPrincipal){
 savePrincipalConfig(num, { banner: bannerToSave })
 const pri = getPrincipals().get(num)
 if(pri) pri.config.banner = bannerToSave
 } else if(sock.isSubBot){
 saveSubConfig(num, { banner: bannerToSave })
 const sub = getSubs().get(num)
 if(sub) sub.config.banner = bannerToSave
 } else {
 savePrincipalConfig(num, { banner: bannerToSave })
 }
 if(sock.subConfig) sock.subConfig.banner = bannerToSave
 if(sock.principalConfig) sock.principalConfig.banner = bannerToSave
 await sock.sendMessage(jid, {text:`✅ Banner cambiado y guardado`}, {quoted:m})
}
export default handler
