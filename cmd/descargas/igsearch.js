import * as cheerio from 'cheerio'

export const handler = {}
handler.name = 'igsearch'
handler.alias = ['igbuscar','googleig']
handler.category = 'descargas'
handler.description = 'Scrapea Google para links de IG'

handler.exec = async (sock, m) => {
 const from = m.key.remoteJid
 const body = m.message?.conversation || m.message?.extendedTextMessage?.text || ''
 const query = body.split(/ +/).slice(1).join(' ')
 if(!query) return sock.sendMessage(from,{text:'Uso: .igsearch gatos\n.igsearch messi reels'},{quoted:m})

 await sock.sendMessage(from,{text:`📥 Buscando resultados *${query}*...`},{quoted:m})

 try{
 const googleUrl = `https://www.google.com/search?q=site:instagram.com+${encodeURIComponent(query)}&num=15`
 const res = await fetch(googleUrl, {
 headers: {
 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
 'Accept': 'text/html',
 'Accept-Language': 'es-PE,es;q=0.9'
 }
 })
 const html = await res.text()
 const $ = cheerio.load(html)
 let links = []
 $('a').each((_, el) => {
 let href = $(el).attr('href')
 if(!href) return
 if(href.includes('instagram.com') && href.includes('/url?q=')){
 let real = new URLSearchParams(href.split('/url?')[1]).get('q')
 if(real && real.includes('instagram.com')) links.push(real)
 } else if(href.includes('instagram.com/p/') || href.includes('instagram.com/reel/') || href.includes('instagram.com/explore/tags/')){
 links.push(href)
 }
 })
 
 // limpiar duplicados y filtrar
 links = [...new Set(links)].filter(l => l.includes('instagram.com')).slice(0,10)
 
 if(links.length === 0) throw 'No salio nada, google bloqueo'

 let txt = `*🔎 IG Search (Google Scrape): ${query}*\nEncontré ${links.length} enlaces reales:\n\n`
 links.forEach((l,i)=>{
 txt += `${i+1}. ${l}\n\n`
 })
 txt += `> Usa .ig + link para descargar\nEj: .ig ${links[0]}`

 await sock.sendMessage(from,{text:txt},{quoted:m})

 }catch(e){
 await sock.sendMessage(from,{text:`❌ Google me bloqueó el scrape\n\nPrueba así manual:\nhttps://www.google.com/search?q=site:instagram.com+${encodeURIComponent(query)}\n\nError: ${e.message || e}`},{quoted:m})
 }
}
