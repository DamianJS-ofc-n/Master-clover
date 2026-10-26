import fs from 'fs'; import path from 'path'; import { pathToFileURL } from 'url'
const BANNER_DEFAULT='https://raw.githubusercontent.com/starlyn-chann/Mistic-star/main/tourl/1791658575065-D6ufbDFJC7Mv.jpg'
let config=null; for(const p of [path.join(process.cwd(),'config.js')]){ if(fs.existsSync(p)){ try{ const mod=await import(pathToFileURL(p).href); config=mod.default||mod; break }catch{} } }
if(!config) config={bot:{prefix:['.'],name:'Miku Bot',banner:BANNER_DEFAULT},channels:{id:'',cname:''}}
let getDiseño=null; for(const p of [path.join(process.cwd(),'core','menudiseños.js')]){ if(fs.existsSync(p)){ try{ const mod=await import(pathToFileURL(p).href); getDiseño=mod.getDiseño||mod.default?.getDiseño; if(getDiseño) break }catch{} } }
export const handler={}; handler.name='menu'; handler.alias=['help','comandos']; handler.category='menus'
function getMyData(sock){
 try{
 let num=sock?.user?.id?.split(':')[0]?.replace(/\D/g,'')||'main'
 let isSub=false, isPrincipal=false, theme='normal', customName=null, customBanner=null
 const pPrincipal = path.join(process.cwd(),'principals',num,'config.json')
 const pSub1 = path.join(process.cwd(),'subbots',num,'config.json')
 const pSub2 = path.join(process.cwd(),'jadiBots',num,'config.json')
 if(fs.existsSync(pPrincipal)){
 try{ const j=JSON.parse(fs.readFileSync(pPrincipal,'utf8')); theme=j.theme||theme; customName=j.name||customName; customBanner=j.banner||customBanner; isPrincipal=true }catch{}
 } else if(fs.existsSync(pSub1) || fs.existsSync(pSub2)){
 const p = fs.existsSync(pSub1) ? pSub1 : pSub2
 try{ const j=JSON.parse(fs.readFileSync(p,'utf8')); theme=j.theme||theme; customName=j.name||customName; customBanner=j.banner||customBanner; isSub=true }catch{}
 }
 if(sock.principalConfig){ if(sock.principalConfig.name) customName=sock.principalConfig.name; if(sock.principalConfig.banner) customBanner=sock.principalConfig.banner; if(sock.principalConfig.theme) theme=sock.principalConfig.theme; if(sock.isPrincipal) isPrincipal=true }
 if(sock.subConfig && !isPrincipal){ if(sock.subConfig.name) customName=sock.subConfig.name; if(sock.subConfig.banner) customBanner=sock.subConfig.banner; if(sock.subConfig.theme) theme=sock.subConfig.theme; if(sock.isSubBot) isSub=true }
 if(!customBanner && config?.bot?.banner) customBanner=config.bot.banner
 return {isSub, isPrincipal, theme, customName, customBanner}
 }catch{ return {isSub:false, isPrincipal:false, theme:'normal', customName:null, customBanner:BANNER_DEFAULT} }
}
const ZONAS={'51':'America/Lima','52':'America/Mexico_City','54':'America/Argentina/Buenos_Aires','57':'America/Bogota','34':'Europe/Madrid','1':'America/New_York'}
function getHour(tz){ try{ return Number(new Intl.DateTimeFormat('en-US',{hour:'numeric',hour12:false,timeZone:tz}).format(new Date())) }catch{ return new Date().getHours() } }
function detectTZ(n){ let num=String(n).replace(/\D/g,''); for(let c of Object.keys(ZONAS).sort((a,b)=>b.length-a.length)){ if(num.startsWith(c)) return ZONAS[c] } return 'America/Lima' }
function getSaludo(h){ if(h>=5&&h<12) return 'buen Amanecer 🌅'; if(h>=12&&h<19) return 'buena tarde 🌇'; return 'buena noche 🌌' }
function countPlugins(){ try{ let root=path.join(process.cwd(),'cmd'); let total=0; function walk(d){ for(let f of fs.readdirSync(d)){ let full=path.join(d,f); let s=fs.statSync(full); if(s.isDirectory()) walk(full); else if(f.endsWith('.js')) total++ } } walk(root); return total }catch{ return 0 } }
function getTotalUsers(){ try{ if(fs.existsSync('./db/database.json')){ let db=JSON.parse(fs.readFileSync('./db/database.json','utf-8')); let data=db.data||db; if(data.allUsers) return Object.keys(data.allUsers).length; else if(data.users){ let s=new Set(); for(let g in data.users) for(let u in data.users[g]) s.add(u); return s.size } } }catch{} return 0 }
function getUserStats(id){ try{ if(global.db?.data?.users?.[id]){ let u=global.db.data.users[id]; return {level:u.level||1, exp:u.exp||0} } }catch{} return {level:1, exp:0} }
function fmtUptime(s){ const d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60); return `${d>0?d+'d ':''}${h}h ${m}m`.trim() }
function scanByFolder(){ const categories=new Map(); const cmdRoot=path.join(process.cwd(),'cmd'); const folders=fs.readdirSync(cmdRoot).filter(f=>{ try{ return fs.statSync(path.join(cmdRoot,f)).isDirectory() }catch{ return false } }); for(const folder of folders){ const fullFolder=path.join(cmdRoot,folder); const files=fs.readdirSync(fullFolder).filter(f=>f.endsWith('.js')); if(files.length===0) continue; const catName=folder.toLowerCase(); if(!categories.has(catName)) categories.set(catName,[]); for(const file of files){ const name=path.basename(file,'.js'); if(!categories.get(catName).some(c=>c.name===name)) categories.get(catName).push({name}) } categories.get(catName).sort((a,b)=>a.name.localeCompare(b.name)) } return categories }
handler.exec=async(sock,m,args,extra)=>{ try{ const {isSub, isPrincipal, theme:savedTheme, customName, customBanner}=getMyData(sock); const jid=m.key.remoteJid; const sender=m.key.participant||jid; const rawNum=(m.key.participant||m.key.remoteJid||'').split('@')[0]; const tz=detectTZ(rawNum); const saludo=getSaludo(getHour(tz)); const temaName=(args[0]||savedTheme||'normal').toLowerCase(); const tema=getDiseño(temaName); const botName=customName||config.bot.name||'Miku Bot'; let type='Principal'; if(isPrincipal) type='Principal'; else if(isSub) type='Sub-bot'; const usermcn=`@${sender.split('@')[0]}`; const prefix=config.bot.prefix?.[0]||'.'; const cmds=countPlugins(); const users=getTotalUsers(); const {level,exp}=getUserStats(sender); const uptime=fmtUptime(process.uptime()); let categories=scanByFolder(); if(categories.size===0){ categories=new Map(); for(let [,cmd] of extra.commands){ if(!cmd?.category) continue; let cat=String(cmd.category).toLowerCase().trim(); if(!categories.has(cat)) categories.set(cat,[]); if(!categories.get(cat).some(c=>c.name===cmd.name)) categories.get(cat).push(cmd) } } let all=[...categories.entries()]; let menus=all.find(([k])=>k==='menus'); let others=all.filter(([k])=>k!=='menus').sort((a,b)=>b[1].length-a[1].length); if(menus) all=[menus,...others]; else all=others; categories=new Map(all); const txt=tema.render({usermcn, botName, type, saludo, cmds, users, categories, prefix, uptime, level, exp}); const channelInfo={forwardingScore:999,isForwarded:true,forwardedNewsletterMessageInfo:{newsletterJid:config.channels.id,newsletterName:config.channels.cname,serverMessageId:-1}}; let bannerToUse=customBanner||BANNER_DEFAULT; try{ if(fs.existsSync(bannerToUse)){ await sock.sendMessage(jid,{image:fs.readFileSync(bannerToUse),caption:txt,mentions:[sender],contextInfo:channelInfo},{quoted:m}) }else{ await sock.sendMessage(jid,{image:{url:bannerToUse},caption:txt,mentions:[sender],contextInfo:channelInfo},{quoted:m}) } }catch{ await sock.sendMessage(jid,{text:txt,mentions:[sender]},{quoted:m}) } }catch(e){ console.log('ERROR MENU',e) } }
export default handler
