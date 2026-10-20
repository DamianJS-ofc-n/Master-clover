export const handler = {}
handler.name = 'r34'
handler.alias = ['rule34', 'rule']
handler.category = 'nsfw'
handler.description = 'Buscar imágenes en Rule34'

handler.exec = async (sock, m) => {
 const from = m.key.remoteJid
 if (!global.db.data.chats) global.db.data.chats = {}
 if (!global.db.data.chats[from]) global.db.data.chats[from] = {}
 let chat = global.db.data.chats[from]
 if (!chat.nsfw) return sock.sendMessage(from, { text: `🔞 NSFW desactivado.\n*.nsfw enable*` }, { quoted: m })

 const body = m.message?.conversation || m.message?.extendedTextMessage?.text || ''
 const texto = body.trim().split(/ +/).slice(1).join(' ').trim()
 if (!texto) return sock.sendMessage(from, { text: `《✧》 Debes poner tag\nEj: *.r34 neko*` }, { quoted: m })

 try {
 await sock.sendMessage(from, { react: { text: '🕒', key: m.key } })
 let tag = texto.replace(/\s+/g, '_')
 let api_key = 'a4e807dd6d4c9e55768772996946e4074030ec02c49049d291e5edb8808a97b004190660b4b36c3d21699144c823ad93491d066e73682a632a38f9b6c3cf951b'
 let user_id = '5753302'
 let url = `https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&json=1&limit=100&tags=${encodeURIComponent(tag)}&api_key=${api_key}&user_id=${user_id}`
 let res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
 let json = await res.json()
 let data = Array.isArray(json)? json : json?.post || []
 let mediaList = data.map(p => p?.file_url || p?.sample_url || p?.preview_url).filter(Boolean)
 if (!mediaList.length) return sock.sendMessage(from, { text: `《✧》 No se encontraron resultados para *${texto}*` }, { quoted: m })

 // agarra 14 aleatorias sin repetir
 mediaList = mediaList.sort(() => 0.5 - Math.random()).slice(0, 14)

 // envio super rapido en paralelo para que se junten
 let sends = mediaList.map((media, i) => {
 let isVideo = /\.mp4/i.test(media)
 return sock.sendMessage(from, {
 [isVideo? 'video' : 'image']: { url: media },
 caption: i === 0? `ꕥ 14 Resultados para » *${texto}*` : ''
 }, { quoted: m })
 })

 await Promise.all(sends)
 await sock.sendMessage(from, { react: { text: '✔️', key: m.key } })

 } catch (e) {
 console.log('[R34]', e)
 await sock.sendMessage(from, { react: { text: '✖️', key: m.key } })
 }
}
export default handler
