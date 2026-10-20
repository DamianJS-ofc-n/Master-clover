export const handler = {}
handler.name = 'xvideos'
handler.alias = ['xvdl']
handler.category = 'nsfw'
import * as cheerio from 'cheerio'

async function getBuffer(url){
 const r=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0'}})
 return Buffer.from(await r.arrayBuffer())
}
async function search(q){
 const dom = "www."+"xvideos"+".com"
 const res=await fetch(`https://${dom}/?k=${encodeURIComponent(q)}`,{headers:{'User-Agent':'Mozilla/5.0'}})
 const $=cheerio.load(await res.text())
 let out=[]
 $("div.mozaique > div").each((i,el)=>{
 let t=$(el).find("p.title a").attr("title")
 let h=$(el).find("p.title a").attr("href")
 if(t&&h) out.push({title:t,url:`https://${dom}`+h})
 })
 return out
}
async function xdl(url){
 const res=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0'}})
 const $=cheerio.load(await res.text())
 return {title:$("meta[property='og:title']").attr("content"), url:$("#html5video > #html5video_base > div > a").attr("href")}
}
handler.exec=async(sock,m)=>{
 const from=m.key.remoteJid
 if(!global.db.data.chats) global.db.data.chats={}
 if(!global.db.data.chats[from]) global.db.data.chats[from]={}
 if(!global.db.data.chats[from].nsfw) return sock.sendMessage(from,{text:"NSFW off.nsfw enable"},{quoted:m})
 let texto=(m.message?.conversation||m.message?.extendedTextMessage?.text||'').split(/ +/).slice(1).join(' ').trim()
 if(!texto) return
 try{
 if(texto.includes("xvideos.com")){
 let r=await xdl(texto)
 let b=await getBuffer(r.url)
 await sock.sendMessage(from,{document:b,mimetype:"video/mp4",fileName:r.title+".mp4",caption:r.title},{quoted:m})
 }else{
 let s=await search(texto)
 let txt=s.slice(0,10).map((v,i)=>`${i+1}. ${v.title}\n${v.url}`).join("\n\n")
 await sock.sendMessage(from,{text:txt},{quoted:m})
 }
 }catch(e){console.log(e)}
}
export default handler
