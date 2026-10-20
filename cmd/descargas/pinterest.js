export const handler = {}
handler.name = 'pinterest'
handler.alias = ['pin','pinteres']
handler.category = 'buscador'
handler.description = 'Busca imagenes en Pinterest'

const KEY = 'hk_live_emalahxKe_Y5yamxR2ysovb70Niz_BUBRFrcq0M4YQA'
const BASE = 'https://hikariapi.skyultraweb.com/api/scrapers/pinterest/search'

handler.exec = async (sock, m) => {
 const from = m.key.remoteJid
 const body = m.message?.conversation || m.message?.extendedTextMessage?.text || ''
 const q = body.trim().split(/ +/).slice(1).join(' ').trim()
 
 if(!q) return sock.sendMessage(from, { text: '𐚁 Usa: .pin gatos' }, { quoted: m })
 
 try {
 const url = `${BASE}?q=${encodeURIComponent(q)}&limit=10&apikey=${KEY}`
 const json = await fetch(url).then(r=>r.json())
 
 if(!json.success || !json.data?.length) throw new Error('Sin resultados')
 const list = json.data.slice(0,5)

 await sock.sendMessage(from, { 
 text: `𐚁 *Pinterest Search*\n\n✐ Busqueda: ${q}\n🌀 Enviando ${list.length} imagenes` 
 }, { quoted: m })

 for(let v of list){
 const imgUrl = v.imageProxy || v.image
 if(!imgUrl) continue
 await sock.sendMessage(from, { image: { url: imgUrl } }, { quoted: m })
 }

 } catch(e){ 
 await sock.sendMessage(from, { text: `𐚁 Error: ${e.message}` }, { quoted: m }) 
 }
}
