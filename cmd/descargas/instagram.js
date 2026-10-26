export const handler = {}
handler.name = 'instagram'
handler.alias = ['ig','igdl','insta']
handler.category = 'descargas'
handler.description = 'Descarga ig reels/posts'

handler.exec = async (sock, m) => {
 const from = m.key.remoteJid
 const body = m.message?.conversation || m.message?.extendedTextMessage?.text || ''
 const url = body.split(' ')[1]
 if(!url || !url.includes('instagram.com')) return sock.sendMessage(from,{text:'✧ Pon link de ig\nEj: .ig https://www.instagram.com/reel/xxx'},{quoted:m})
 await sock.sendMessage(from,{text:'⏳ Bajando de IG...'},{quoted:m})
 try{
 const res = await fetch(`https://api.delirius.store/download/instagram?url=${url}`)
 const data = await res.json()
 for(let media of data.data){
 if(media.type === 'video') await sock.sendMessage(from,{video:{url:media.url}},{quoted:m})
 else await sock.sendMessage(from,{image:{url:media.url}},{quoted:m})
 }
 }catch(e){
 await sock.sendMessage(from,{text:`No se pudo descargar: ${e}`},{quoted:m})
 }
}
