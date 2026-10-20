import axios from 'axios'
export const handler = {}
handler.name = 'gelbooru'
handler.alias = ['gbooru']
handler.category = 'nsfw'
handler.description = 'Buscar imágenes en Gelbooru'

handler.exec = async (sock, m) => {
 const from = m.key.remoteJid
 if (!global.db.data.chats) global.db.data.chats = {}
 if (!global.db.data.chats[from]) global.db.data.chats[from] = {}
 let chat = global.db.data.chats[from]
 if (!chat.nsfw) return sock.sendMessage(from, { text: `🔞 NSFW desactivado.\n*.nsfw enable*` }, { quoted: m })

 const body = m.message?.conversation || m.message?.extendedTextMessage?.text || ''
 const texto = body.trim().split(/ +/).slice(1).join(' ').trim()
 if (!texto) return sock.sendMessage(from, { text: `《✧》 Debes poner tag\nEj: *.gelbooru neko*` }, { quoted: m })

 try {
 await sock.sendMessage(from, { react: { text: '🕒', key: m.key } })
 let tag = texto.replace(/\s+/g, '_')
 let api_key = '98f554258c88c44f4dd28ccde0c28f36682b2a992490ab35ebcc7baf7e196a86d7550b174bce577b8cc3f544e9b3ad0f6aeb09ad63bf89a9141cc3eddb6fbfd2'
 let user_id = '1917269'
 let url = `https://gelbooru.com/index.php?page=dapi&s=post&q=index&json=1&limit=50&tags=${encodeURIComponent(tag)}&api_key=${api_key}&user_id=${user_id}`
 let res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://gelbooru.com/' } })
 let data = res.data?.post || []
 if (!data.length) return sock.sendMessage(from, { text: `《✧》 No se encontraron resultados para *${texto}*` }, { quoted: m })
 let shuffled = data.sort(() => Math.random() - 0.5)
 for (let post of shuffled) {
 let fileUrl = post.file_url || post.sample_url
 if (!fileUrl) continue
 try {
 let imgRes = await axios.get(fileUrl, { responseType: 'arraybuffer', headers: { 'Referer': 'https://gelbooru.com/' }, timeout: 15000 })
 let buffer = Buffer.from(imgRes.data)
 let isVideo = /\.mp4/i.test(fileUrl)
 await sock.sendMessage(from, { [isVideo? 'video' : 'image']: buffer, caption: `ꕥ Resultados para » *${texto}*` }, { quoted: m })
 await sock.sendMessage(from, { react: { text: '✔️', key: m.key } })
 return
 } catch {}
 }
 await sock.sendMessage(from, { text: `《✧》 No se encontraron resultados para *${texto}*` }, { quoted: m })
 } catch (e) {
 console.log('[GELBOORU]', e)
 await sock.sendMessage(from, { react: { text: '✖️', key: m.key } })
 }
}
export default handler
