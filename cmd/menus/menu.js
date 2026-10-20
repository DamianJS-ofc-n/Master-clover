import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'

const BANNER_DEFAULT = 'https://raw.githubusercontent.com/starlyn-chann/Mistic-star/main/tourl/1791658575065-D6ufbDFJC7Mv.jpg'
let config=null
for(const p of [path.join(process.cwd(),'config.js'), path.resolve('./config.js')]){
 if(fs.existsSync(p)){ try{ const mod=await import(pathToFileURL(p).href); config=mod.default||mod; break }catch{} }
}
if(!config) config={bot:{prefix:['.'],name:'Miku Bot',banner:BANNER_DEFAULT},channels:{id:'',cname:''}}

let getDiseño=null
for(const p of [path.join(process.cwd(),'core','menudiseños.js')]){
 if(fs.existsSync(p)){ try{ const mod=await import(pathToFileURL(p).href); getDiseño=mod.getDiseño||mod.default?.getDiseño; if(getDiseño) break }catch{} }
}

export const handler={}
handler.name='menu'
handler.alias=['help','comandos']
handler.category='menus'

function getMyData(sock){
 try{
 let num=sock?.user?.id?.split(':')[0]?.replace(/\D/g,'')||'main'
 let isSub=!!sock.isSubBot, theme='normal', customName=null, customBanner=null
 const jadiPath=path.join(process.cwd(),'jadiBots',num,'config.json')
 if(fs.existsSync(jadiPath)){ try{ const j=JSON.parse(fs.readFileSync(jadiPath,'utf8')); if(j.theme) theme=j.theme; if(j.name) customName=j.name; if(j.banner) customBanner=j.banner; isSub=true }catch{} }
 if(sock.subConfig){ theme=sock.subConfig.theme||theme; if(sock.subConfig.name) customName=sock.subConfig.name; if(sock.subConfig.banner) customBanner=sock.subConfig.banner }
 if(!isSub){
 try{
 if(fs.existsSync('./db/custom_main.json')){ let d=JSON.parse(fs.readFileSync('./db/custom_main.json','utf8')); if(d.banner) customBanner=d.banner; if(d.name) customName=d.name }
 if(!customBanner && fs.existsSync('db/banner_main.jpg')) customBanner='db/banner_main.jpg'
 if(fs.existsSync('./db/menu_theme.json')){ let t=JSON.parse(fs.readFileSync('./db/menu_theme.json','utf8')); if(t.theme) theme=t.theme }
 }catch{}
 }
 if(!customBanner && config?.bot?.banner) customBanner=config.bot.banner
 return {isSub, theme, customName, customBanner}
 }catch{ return {isSub:false, theme:'normal', customName:null, customBanner:BANNER_DEFAULT} }
}

const ZONAS={'51':'America/Lima','52':'America/Mexico_City','54':'America/Argentina/Buenos_Aires','57':'America/Bogota','34':'Europe/Madrid','1':'America/New_York'}
function getHour(tz){ try{ return Number(new Intl.DateTimeFormat('en-US',{hour:'numeric',hour12:false,timeZone:tz}).format(new Date())) }catch{ return new Date().getHours() } }
function detectTZ(n){ let num=String(n).replace(/\D/g,''); for(let c of Object.keys(ZONAS).sort((a,b)=>b.length-a.length)){ if(num.startsWith(c)) return ZONAS[c] } return 'America/Lima' }
function getSaludo(h){ if(h>=5&&h<12) return 'buen Amanecer 🌅'; if(h>=12&&h<19) return 'buena tarde 🌇'; return 'buena noche 🌌' }
function countPlugins(){ try{ let root=path.join(process.cwd(),'cmd'); if(!fs.existsSync(root)) root=path.join(process.cwd(),'core','plugins'); let total=0; function walk(d){ for(let f of fs.readdirSync(d)){ let full=path.join(d,f); let s=fs.statSync(full); if(s.isDirectory()) walk(full); else if(f.endsWith('.js')) total++ } } walk(root); return total }catch{ return 0 } }
function getTotalUsers(){ try{ if(global.db?.data?.users) return Object.keys(global.db.data.users).length; if(fs.existsSync('./db/database.json')){ let db=JSON.parse(fs.readFileSync('./db/database.json','utf8')); if(db.users) return Object.keys(db.users).length; if(db.data?.users) return Object.keys(db.data.users).length; return Object.keys(db).length } return 0 }catch{ return 0 } }
function getUserStats(id){ try{ if(global.db?.data?.users?.[id]){ let u=global.db.data.users[id]; return {level:u.level||1, exp:u.exp||0} } if(fs.existsSync('./db/database.json')){ let db=JSON.parse(fs.readFileSync('./db/database.json','utf8')); let u=db.users?.[id]||db[id]; if(u) return {level:u.level||1, exp:u.exp||0} } }catch{} return {level:1, exp:0} }
function fmtUptime(s){ const d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60); return `${d>0?d+'d ':''}${h}h ${m}m`.trim() }

function scanByFolder(){
 const categories = new Map()
 const cmdRoot = path.join(process.cwd(),'cmd')
 if(!fs.existsSync(cmdRoot)) return categories
 const folders = fs.readdirSync(cmdRoot).filter(f => {
 try{ return fs.statSync(path.join(cmdRoot,f)).isDirectory() }catch{ return false }
 })
 for(const folder of folders){
 const fullFolder = path.join(cmdRoot, folder)
 const files = fs.readdirSync(fullFolder).filter(f => f.endsWith('.js'))
 if(files.length===0) continue
 const catName = folder.toLowerCase()
 if(!categories.has(catName)) categories.set(catName, [])
 for(const file of files){
 const name = path.basename(file,'.js')
 if(!categories.get(catName).some(c=>c.name===name)){
 categories.get(catName).push({ name })
 }
 }
 categories.get(catName).sort((a,b)=> a.name.localeCompare(b.name))
 }
 const loose = fs.readdirSync(cmdRoot).filter(f=> f.endsWith('.js')).map(f=> path.basename(f,'.js'))
 if(loose.length){
 if(!categories.has('general')) categories.set('general',[])
 for(const n of loose) if(!categories.get('general').some(c=>c.name===n)) categories.get('general').push({name:n})
 }
 return categories
}

handler.exec=async(sock,m,args,extra)=>{
 try{
 const {isSub, theme:savedTheme, customName, customBanner}=getMyData(sock)
 const jid=m.key.remoteJid
 const sender=m.key.participant||jid
 const rawNum=(m.key.participant||m.key.remoteJid||'').split('@')[0]
 const tz=detectTZ(rawNum)
 const saludo=getSaludo(getHour(tz))
 const temaName=(args[0]||savedTheme||'normal').toLowerCase()
 const tema=getDiseño(temaName)

 const botName=customName||config.bot.name||'Miku Bot'
 const type=isSub?'Sub-bot':'Principal'
 const usermcn=`@${sender.split('@')[0]}`
 const prefix=config.bot.prefix?.[0]||'.'
 const cmds=countPlugins()
 const users=getTotalUsers()
 const {level,exp}=getUserStats(sender)
 const uptime=fmtUptime(process.uptime())

 let categories = scanByFolder()
 if(categories.size===0){
 categories=new Map()
 for(let [,cmd] of extra.commands){ if(!cmd?.category) continue; let cat=String(cmd.category).toLowerCase().trim(); if(!categories.has(cat)) categories.set(cat,[]); if(!categories.get(cat).some(c=>c.name===cmd.name)) categories.get(cat).push(cmd) }
 }

 // === FIX ORDEN: MENUS PRIMERO + DEL QUE MAS TIENE AL QUE MENOS ===
 let all = [...categories.entries()]
 let menus = all.find(([k])=> k === 'menus')
 let others = all.filter(([k])=> k !== 'menus').sort((a,b)=> b[1].length - a[1].length)
 if(menus) all = [menus, ...others]
 else all = others
 categories = new Map(all)
 // === FIN FIX ===

 const txt=tema.render({usermcn, botName, type, saludo, cmds, users, categories, prefix, uptime, level, exp})

 const channelInfo={forwardingScore:999,isForwarded:true,forwardedNewsletterMessageInfo:{newsletterJid:config.channels.id,newsletterName:config.channels.cname,serverMessageId:-1}}
 let bannerToUse=customBanner||BANNER_DEFAULT
 try{
 if(fs.existsSync(bannerToUse)){
 await sock.sendMessage(jid,{image:fs.readFileSync(bannerToUse),caption:txt,mentions:[sender],contextInfo:channelInfo},{quoted:m})
 }else{
 await sock.sendMessage(jid,{image:{url:bannerToUse},caption:txt,mentions:[sender],contextInfo:channelInfo},{quoted:m})
 }
 }catch{
 await sock.sendMessage(jid,{text:txt,mentions:[sender]},{quoted:m})
 }
 }catch(e){ console.log('ERROR MENU',e) }
}
