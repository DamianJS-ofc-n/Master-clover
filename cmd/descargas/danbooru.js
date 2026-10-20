export const handler = {}
handler.name = 'danbooru'
handler.alias = ['dbooru']
handler.category = 'nsfw'
handler.description = 'Buscar imágenes en Danbooru'

handler.exec = async (sock, m) => {
 const from = m.key.remoteJid
 if (!global.db.data.chats) global.db.data.chats = {}
 if (!global.db.data.chats[from]) global.db.data.chats[from] = {}
 let chat = global.db.data.chats[from]
 if (!chat.nsfw) return sock.sendMessage(from, { text: `🔞 NSFW desactivado.\n*.nsfw enable*` }, { quoted: m })

 const body = m.message?.conversation || m.message?.extendedTextMessage?.text || ''
 const texto = body.trim().split(/ +/).slice(1).join(' ').trim()
 if (!texto) return sock.sendMessage(from, { text: `《✧》 Debes poner tag\nEj: *.danbooru neko*` }, { quoted: m })

 try {
 await sock.sendMessage(from, { react: { text: '🕒', key: m.key } })
 let tag = texto.replace(/\s+/g, '_')
 let url = `https://danbooru.donmai.us/posts.json?tags=${encodeURIComponent(tag)}+rating:explicit&limit=100`
 let res = await fetch(url, { headers: { 'User-Agent': 'KITSUNE-MD/1.0' } })
 let json = await res.json()
 let mediaList = json.map(p => p?.file_url || p?.large_file_url || p?.preview_file_url).filter(u => typeof u === 'string' && u.startsWith('http'))
 if (!mediaList.length) return sock.sendMessage(from, { text: `《✧》 No se encontraron resultados para *${texto}*` }, { quoted: m })
 let media = mediaList[Math.floor(Math.random() * mediaList.length)]
 await sock.sendMessage(from, { image: { url: media }, caption: `ꕥ Resultados para » *${texto}*` }, { quoted: m })
 await sock.sendMessage(from, { react: { text: '✔️', key: m.key } })
 } catch (e) {
 console.log('[DANBOORU]', e)
 await sock.sendMessage(from, { react: { text: '✖️', key: m.key } })
 }
}
export default handler
