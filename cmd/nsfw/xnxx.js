import fetch from "node-fetch"
import * as cheerio from "cheerio"
import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'

let config=null
for(const p of [path.join(process.cwd(),'config.js'), path.resolve('./config.js')]){
 if(fs.existsSync(p)){ try{ const mod=await import(pathToFileURL(p).href); config=mod.default||mod; break }catch{} }
}
if(!config) config={bot:{name:'Miku Bot'}}

function getMyData(sock){
 try{
 let num=sock?.user?.id?.split(':')[0]?.replace(/\D/g,'')||'main'
 let customName=null
 const jadiPath=path.join(process.cwd(),'jadiBots',num,'config.json')
 if(fs.existsSync(jadiPath)){ try{ const j=JSON.parse(fs.readFileSync(jadiPath,'utf8')); if(j.name) customName=j.name }catch{} }
 if(sock.subConfig && sock.subConfig.name) customName=sock.subConfig.name
 if(fs.existsSync('./db/custom_main.json')){ try{ let d=JSON.parse(fs.readFileSync('./db/custom_main.json','utf8')); if(d.name) customName=d.name }catch{} }
 return { botName: customName||config.bot.name||'Miku Bot' }
 }catch{ return { botName: config?.bot?.name||'Miku Bot' } }
}

export const handler = {}
handler.name = 'xnxx'
handler.alias = ['xnxxdl']
handler.category = 'nsfw'

async function xnxxdl(URL){
  const res = await fetch(URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html',
      'Referer': 'https://www.xnxx.com/',
      'Cookie': 'wp=1'
    }
  })
  if(!res.ok) throw new Error(`XNXX respondió ${res.status}`)
  const html = await res.text()
  const $ = cheerio.load(html)
  const title = $('meta[property="og:title"]').attr("content") || $("title").text().trim() || 'xnxx_video'

  // metodo 1: html5player.setVideoUrl
  let low = (html.match(/html5player\.setVideoUrlLow\('(.*?)'\)/)||[])[1] || ''
  let high = (html.match(/html5player\.setVideoUrlHigh\('(.*?)'\)/)||[])[1] || ''
  let hls = (html.match(/html5player\.setVideoUrlHls\('(.*?)'\)/)||[])[1] || ''
  let mp4 = (html.match(/html5player\.setVideoUrlMp4\('(.*?)'\)/)||[])[1] || ''

  // metodo 2: buscar cualquier mp4 directo
  if(!high &&!low){
    const m = html.match(/https?:\\?\/\\?\/[^"']+\.mp4[^"']*/g)
    if(m){
      high = m[0].replace(/\\/g,'')
    }
  }

  const files = { low, high, hls, mp4 }
  return { title, files }
}

async function search(query){
  const baseurl="https://www.xnxx.com"
  const res=await fetch(`${baseurl}/search/${query}/${Math.floor(Math.random()*3)+1}`, {
    headers: { 'User-Agent':'Mozilla/5.0', 'Cookie':'wp=1' }
  })
  const html=await res.text()
  const $=cheerio.load(html)
  const results=[]
  $("div.mozaique").each(function(a,b){
    $(b).find("div.thumb-under").each(function(c,d){
      const href=$(d).find("a").attr("href")||""
      if(!href) return
      const url=baseurl+href.replace("/THUMBNUM/","/")
      const title=$(d).find("a").attr("title")||$(d).find("a").text().trim()||"Sin titulo"
      if(title && url.includes('/video-')) results.push({title, link:url})
    })
  })
  return results
}

handler.exec = async (sock, m, args, extra) => {
 const from = m.key.remoteJid
 if (!global.db.data.chats) global.db.data.chats = {}
 if (!global.db.data.chats[from]) global.db.data.chats[from] = {}
 let chat = global.db.data.chats[from]
 if (!chat.nsfw) return sock.sendMessage(from, { text: `🔞 NSFW desactivado.\n*.nsfw enable*` }, { quoted: m })

 const usedPrefix = extra?.usedPrefix || '.'
 const text = args.join(" ").trim()
 const { botName } = getMyData(sock)
 if(!text) return sock.sendMessage(from,{text:`《✧》 Pon link o búsqueda\n*.xnxx tetona*\n*.xnxx https://www.xnxx.com/video-xxxx*`},{quoted:m})

 try{
   if(text.includes("xnxx.com")){
     await sock.sendMessage(from,{react:{text:'⏳',key:m.key}})
     const data = await xnxxdl(text)
     let dll = data.files.high || data.files.low || data.files.hls || data.files.mp4
     if(!dll) throw new Error('No se pudo extraer URL, XNXX cambió HTML')
     // limpiar url
     dll = dll.replace(/\\/g,'')
     const r = await fetch(dll, { headers: { 'Referer':'https://www.xnxx.com/', 'User-Agent':'Mozilla/5.0' } })
     if(!r.ok) throw new Error(`Fallo descarga video ${r.status}`)
     const buf = Buffer.from(await r.arrayBuffer())
     if(buf.length < 10000) throw new Error('Video muy pequeño / bloqueado')
     await sock.sendMessage(from,{
       video: buf,
       mimetype: "video/mp4",
       fileName: `${data.title.slice(0,40)}.mp4`,
       caption: `乂 XNXX 乂\n≡ ${data.title}\n\n🤖 ${botName}`
     },{quoted:m})
     await sock.sendMessage(from,{react:{text:'✔️',key:m.key}})
     return
   }

   await sock.sendMessage(from,{react:{text:'🕒',key:m.key}})
   const results=await search(encodeURIComponent(text))
   if(!results.length) {
     await sock.sendMessage(from,{react:{text:'✖️',key:m.key}})
     return sock.sendMessage(from,{text:`No hay resultados para *${text}*`},{quoted:m})
   }
   const list=results.slice(0,10).map((v,i)=>`${i+1}. ${v.title}\n${v.link}`).join("\n\n")
   await sock.sendMessage(from,{text:`乂 XNXX SEARCH 乂\n\n${list}\n\nResponde con el link para descargar\n${usedPrefix}xnxx <url>\n\n🤖 ${botName}`},{quoted:m})
   await sock.sendMessage(from,{react:{text:'✔️',key:m.key}})

 }catch(e){
   console.log('[XNXX FAIL]', e)
   await sock.sendMessage(from,{react:{text:'✖️',key:m.key}})
   await sock.sendMessage(from,{text:`❌ Falló: ${e.message}\nPrueba otro link, XNXX a veces banea IPs del host.`},{quoted:m})
 }
}