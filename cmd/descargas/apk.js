import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'

const BANNER_DEFAULT = 'https://raw.githubusercontent.com/starlyn-chann/Mistic-star/main/tourl/1791658575065-D6ufbDFJC7Mv.jpg'
let config=null
for(const p of [path.join(process.cwd(),'config.js'), path.resolve('./config.js')]){
 if(fs.existsSync(p)){ try{ const mod=await import(pathToFileURL(p).href); config=mod.default||mod; break }catch{} }
}
if(!config) config={bot:{prefix:['.'],name:'Miku Bot',banner:BANNER_DEFAULT}}

export const handler = {}
handler.name = 'apk'
handler.alias = ['apkdl','aptoide','playstore']
handler.category = 'descargas'
handler.description = 'APK via Aptoide con nombre real del bot'

// MISMA FUNCION QUE TU MENU
function getMyData(sock){
 try{
 let num=sock?.user?.id?.split(':')[0]?.replace(/\D/g,'')||'main'
 let isSub=!!sock.isSubBot, customName=null
 const jadiPath=path.join(process.cwd(),'jadiBots',num,'config.json')
 if(fs.existsSync(jadiPath)){ try{ const j=JSON.parse(fs.readFileSync(jadiPath,'utf8')); if(j.name) customName=j.name; isSub=true }catch{} }
 if(sock.subConfig && sock.subConfig.name) customName=sock.subConfig.name
 if(!isSub){
  try{
   if(fs.existsSync('./db/custom_main.json')){ let d=JSON.parse(fs.readFileSync('./db/custom_main.json','utf8')); if(d.name) customName=d.name }
  }catch{}
 }
 return { botName: customName||config.bot.name||'Miku Bot' }
 }catch{ return { botName: config?.bot?.name||'Miku Bot' } }
}

async function searchAptoide(q){
  const url = `https://ws75.aptoide.com/api/7/apps/search/query=${encodeURIComponent(q)}/limit=5`
  const r = await fetch(url, { headers: { 'User-Agent':'Aptoide' } })
  const j = await r.json()
  const list = j?.datalist?.list
  if(!list ||!list.length) throw new Error('No encontrado en Aptoide')
  return list[0]
}
async function getAptoideInfo(pkg){
  const url = `https://ws75.aptoide.com/api/7/apps/getAppMeta/package_name=${encodeURIComponent(pkg)}`
  const r = await fetch(url)
  const j = await r.json()
  if(!j?.data) throw new Error('No meta')
  return j.data
}

handler.exec = async (sock, m) => {
 const from = m.key.remoteJid
 const body = m.message?.conversation || m.message?.extendedTextMessage?.text || ''
 const text = body.trim().split(/ +/).slice(1).join(' ').trim()
 if(!text) return sock.sendMessage(from,{text:`⚠️ Usa: *.apk facebook*`},{quoted:m})

 try{ await sock.sendMessage(from,{react:{text:"⏳", key:m.key}}) }catch{}

 try{
   const search = await searchAptoide(text)
   const meta = await getAptoideInfo(search.package).catch(()=>search)

   const info = {
     name: meta.name || search.name,
     package: meta.package || search.package,
     version: meta.file?.vername || search.file?.vername || '-',
     size: meta.file?.filesize? `${(meta.file.filesize/1024/1024).toFixed(1)} MB` : '-',
     downloads: meta.stats?.downloads || search.stats?.downloads || '-',
     rating: meta.stats?.prating?.avg || search.stats?.prating?.avg || '-',
     developer: meta.developer?.name || search.store?.name || '-',
     icon: meta.icon || search.icon,
     dl: meta.file?.path || search.file?.path
   }

   if(!info.dl) throw new Error('Sin link')

   const { botName } = getMyData(sock)

   const caption = `*📱 A P T O I D E - APK*\n\n`+
   `𖠁 *Nombre:* ${info.name}\n`+
   `𖠁 *Package:* ${info.package}\n`+
   `𖠁 *Versión:* ${info.version}\n`+
   `𖠁 *Tamaño:* ${info.size}\n`+
   `𖠁 *Dev:* ${info.developer}\n`+
   `𖠁 *Rating:* ${info.rating}\n\n`+
   `🤖 _${botName}_`

   if(info.icon) await sock.sendMessage(from,{image:{url:info.icon},caption},{quoted:m}).catch(()=> sock.sendMessage(from,{text:caption},{quoted:m}))
   else await sock.sendMessage(from,{text:caption},{quoted:m})

   const fileRes = await fetch(info.dl)
   const buf = Buffer.from(await fileRes.arrayBuffer())

   await sock.sendMessage(from,{
     document: buf,
     mimetype: "application/vnd.android.package-archive",
     fileName: `${info.name.replace(/[^a-z0-9]/gi,'_')}_${info.version}.apk`
   },{quoted:m})

   try{ await sock.sendMessage(from,{react:{text:"✅", key:m.key}}) }catch{}

 }catch(e){
   console.error(e)
   await sock.sendMessage(from,{text:`❌ Error: ${e.message}`},{quoted:m})
 }
}
