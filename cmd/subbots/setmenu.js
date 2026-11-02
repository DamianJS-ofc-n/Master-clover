import fs from 'fs'
import path from 'path'
import { getSubConfig, saveSubConfig, getSub } from '../../lib/jadi.js'
import config from '../../config.js'

export const handler={}
handler.name='setmenu'
handler.alias=['tema','theme']
handler.category='subbots'

function getOwners(){return (config?.bot?.owner||[]).map(n=>n.toString().split('@')[0].replace(/\D/g,'')).filter(Boolean)}

handler.exec=async(sock,m,args)=>{
 const temas=['normal','pro','galactico','hallowen','electro','simple','cawai','acuatico','marino','astral']
 const t=(args[0]||'').toLowerCase()

 // NUMERO REAL DEL BOT, no del usuario
 let botNum = ''
 try{
 botNum = sock.user?.id?.split(':')[0]?.split('@')[0]?.replace(/\D/g,'')
 if(sock.isSubBot && sock.subNumber) botNum = sock.subNumber.toString().replace(/\D/g,'')
 }catch{}

 if(!botNum) botNum = (m.key?.remoteJid||'').split('@')[0].replace(/\D/g,'')

 if(!t || !temas.includes(t)){
 let actual = 'normal'
 try{
 const p1 = path.join(process.cwd(),'principals',botNum,'config.json')
 const p2 = path.join(process.cwd(),'subbots',botNum,'config.json')
 const p3 = path.join(process.cwd(),'jadiBots',botNum,'config.json')
 for(let p of [p1,p2,p3]){
 if(fs.existsSync(p)){
 let j=JSON.parse(fs.readFileSync(p,'utf8'))
 if(j.theme){ actual=j.theme; break }
 }
 }
 if(sock.subConfig?.theme) actual=sock.subConfig.theme
 if(sock.principalConfig?.theme) actual=sock.principalConfig.theme
 }catch{}
 return sock.sendMessage(m.key.remoteJid,{text:`*🎨 TEMAS DISPONIBLES*\n${temas.map(x=>`• ${x} ${x==actual?'<- actual':''}`).join('\n')}\n\nUso: .setmenu marino\nBotNum: ${botNum}\nActual: ${actual}`},{quoted:m})
 }

 // GUARDAR EN LAS 3 CARPETAS POSIBLES
 const paths=[
 path.join(process.cwd(),'principals',botNum,'config.json'),
 path.join(process.cwd(),'subbots',botNum,'config.json'),
 path.join(process.cwd(),'jadiBots',botNum,'config.json')
 ]
 for(let p of paths){
 try{
 let old={}
 if(fs.existsSync(p)) old=JSON.parse(fs.readFileSync(p,'utf8'))
 old.theme=t
 fs.mkdirSync(path.dirname(p),{recursive:true})
 fs.writeFileSync(p, JSON.stringify(old,null,2))
 }catch(e){ console.log('error save',e) }
 }
 try{ saveSubConfig(botNum,{theme:t}) }catch{}

 // ACTUALIZAR MEMORIA INSTANTANEA
 if(sock.subConfig) sock.subConfig.theme=t
 if(sock.principalConfig) sock.principalConfig.theme=t
 sock.subConfig = {...(sock.subConfig||{}), theme:t}

 if(args[1]=='all'){
 const dir=path.join(process.cwd(),'subbots')
 if(fs.existsSync(dir)){
 for(let f of fs.readdirSync(dir)){
 if(!/^\d+$/.test(f)) continue
 for(let p of [path.join(dir,f,'config.json'), path.join(process.cwd(),'jadiBots',f,'config.json')]){
 try{ let o={}; if(fs.existsSync(p)) o=JSON.parse(fs.readFileSync(p,'utf8')); o.theme=t; fs.mkdirSync(path.dirname(p),{recursive:true}); fs.writeFileSync(p, JSON.stringify(o,null,2)) }catch{}
 }
 try{ let s=getSub(f); if(s?.sock?.subConfig) s.sock.subConfig.theme=t }catch{}
 }
 }
 }

 return sock.sendMessage(m.key.remoteJid,{text:`✅ Tema cambiado a *${t}* \nBot: ${botNum}\nAhora usa .menu`},{quoted:m})
}
export default handler
