export const handler = {}
handler.name = 'tiktok'
handler.alias = ['tt','tiktokdl']
handler.category = 'descargas'
handler.description = 'Descarga tiktok sin marca de agua'

handler.exec = async (sock, m) => {
 const from = m.key.remoteJid
 const body = m.message?.conversation || m.message?.extendedTextMessage?.text || ''
 const url = body.split(' ')[1]
 if(!url || !url.includes('tiktok')) return sock.sendMessage(from,{text:'✧ Pon link de tiktok\nEj: .tiktok https://vm.tiktok.com/xxx'},{quoted:m})
 
 await sock.sendMessage(from,{text:'⏳ Descargando...'},{quoted:m})
 try {
 const res = await fetch(`https://api.delirius.store/download/tiktok?url=${url}`)
 const data = await res.json()
 if(!data.status) throw 'No se pudo descargar'
 const video = data.data.meta.media[0].org
 const desc = data.data.title || 'Tiktok'
 await sock.sendMessage(from,{video:{url:video}, caption:`*${desc}*`},{quoted:m})
 } catch(e){
 try{
 const r2 = await fetch(`https://api.vreden.my.id/api/tiktok?url=${url}`)
 const d2 = await r2.json()
 await sock.sendMessage(from,{video:{url:d2.result.nowm}, caption:d2.result.title},{quoted:m})
 }catch(err){
 await sock.sendMessage(from,{text:`Error: ${e}\n${err}`},{quoted:m})
 }
 }
}
