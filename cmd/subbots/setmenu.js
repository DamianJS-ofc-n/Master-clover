import fs from 'fs'
import path from 'path'
import { getSubConfig, saveSubConfig, getSub, getSubs } from '../../lib/jadi.js'
import { savePrincipalConfig, getPrincipalConfig, getPrincipals } from '../../lib/principals.js'
import config from '../../config.js'

export const handler={}
handler.name='setmenu'
handler.alias=['tema','theme']
handler.category='subbots'

handler.exec=async(sock,m,args)=>{
 const temas=['normal','pro','galactico','hallowen','electro','simple','cawai','acuatico','marino','astral','nares']
 const pretty = { normal: '𝗻𝗼𝗿𝗺𝗮𝗹', pro: '𝗽𝗿𝗼', galactico: '𝗴𝗮𝗹𝗮́𝗰𝘁𝗶𝗰𝗼', hallowen: '𝗵𝗮𝗹𝗹𝗼𝘄𝗲𝗲𝗻', electro: '𝗲𝗹𝗲𝗰𝘁𝗿𝗼', simple: '𝘀𝗶𝗺𝗽𝗹𝗲', cawai: '𝗰𝗮𝘄𝗮𝗶𝗶', acuatico: '𝗮𝗰𝘂𝗮́𝘁𝗶𝗰𝗼', marino: '𝗺𝗮𝗿𝗶𝗻𝗼', astral: '𝗮𝘀𝘁𝗿𝗮𝗹', nares: '𝗻𝗮𝗿𝗲𝘀' }
 const t=(args[0]||'').toLowerCase()
 let botNum = sock.principalNumber || sock.subNumber || sock.user?.id?.split(':')[0]?.split('@')[0]?.replace(/\D/g,'') || ''
 botNum = String(botNum).replace(/\D/g,'')
 if(!botNum) botNum = (m.key?.remoteJid||'').split('@')[0].replace(/\D/g,'')
 let actual = 'normal'
 try{
 if(sock.isPrincipal) actual = getPrincipalConfig(botNum)?.theme || sock.principalConfig?.theme || 'normal'
 else if(sock.isSubBot) actual = getSubConfig(botNum)?.theme || sock.subConfig?.theme || 'normal'
 else actual = sock.subConfig?.theme || sock.principalConfig?.theme || 'normal'
 }catch{}
 if(!t || !temas.includes(t)){
 let lista = temas.map(x=>`✨ ${pretty[x]||x}${x===actual ? ' (•̀ᴗ•̀) ☞ 𝗮𝗰𝘁𝘂𝗮𝗹' : ''}`).join('\n')
 let txt = `✦ · ── 𖥸 ── · ✦\n> 𝗍ᥱmᥲs ძіs⍴᥆ᥒіᑲᥣᥱs\n✦ · ── 𖥸 ── · ✦\n${lista}\n✦ · ── 𖥸 ── · ✦\n☁️ \`Uso: .setmenu marino\`\n☁️ \`BotNum: ${botNum}\`\n☁️ \`Actual: ${actual}\`\n✦ · ── 𖥸 ── · ✦`
 return sock.sendMessage(m.key.remoteJid,{text: txt},{quoted:m})
 }
 if(sock.isPrincipal){
 savePrincipalConfig(botNum, { theme: t })
 const pri = getPrincipals().get(botNum)
 if(pri) pri.config.theme = t
 } else {
 saveSubConfig(botNum, { theme: t })
 const sub = getSubs().get(botNum)
 if(sub) sub.config.theme = t
 }
 if(sock.subConfig) sock.subConfig.theme=t
 if(sock.principalConfig) sock.principalConfig.theme=t
 if(args[1]=='all'){
 const dir=path.join(process.cwd(),'subbots')
 if(fs.existsSync(dir)){ for(let f of fs.readdirSync(dir)){ if(!/^\d+$/.test(f)) continue; try{ saveSubConfig(f,{theme:t}) }catch{} } }
 const pdir=path.join(process.cwd(),'principals')
 if(fs.existsSync(pdir)){ for(let f of fs.readdirSync(pdir)){ if(!/^\d+$/.test(f)) continue; try{ savePrincipalConfig(f,{theme:t}) }catch{} } }
 }
 return sock.sendMessage(m.key.remoteJid,{text:`✅ Tema cambiado a *${t}* \nBot: ${botNum}\nAhora usa .menu`},{quoted:m})
}
export default handler
