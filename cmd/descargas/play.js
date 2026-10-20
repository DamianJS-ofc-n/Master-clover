import yts from 'yt-search'
import config from '../../config.js'

export const handler = {}
handler.name = 'play'
handler.alias = ['ytmp3','mp3','ytaudio','audio']
handler.category = 'descargas'
handler.description = 'Descarga audio de YouTube'

const KEY = 'hk_live_emalahxKe_Y5yamxR2ysovb70Niz_BUBRFrcq0M4YQA'

handler.exec = async (sock, m) => {
 const from = m.key.remoteJid
 const body = m.message?.conversation || m.message?.extendedTextMessage?.text || ''
 const q = body.trim().split(/ +/).slice(1).join(' ').trim()
 if(!q) return sock.sendMessage(from, { text: 'Usa: .play bad bunny dtmf' }, { quoted: m })

 const botName = config.botName || config.name || 'Master Clover'
 try{
 let videoUrl = q
 let video = {}
 if(!q.startsWith('http')){
 const s = await yts(q)
 if(!s.videos.length) throw new Error('Sin resultados')
 video = s.videos[0]
 videoUrl = video.url
 } else {
 const s = await yts(q)
 video = s.videos[0] || {}
 }
 const title = video.title || q
 const channel = video.author?.name || 'YouTube'
 const duration = video.timestamp || 'N/A'
 const views = video.views?.toLocaleString() || 'N/A'
 const ago = video.ago || 'N/A'
 const thumb = video.thumbnail || video.image

 const infoText = `┏━━━━━━━━━━━━━━━━━━━━━┓
┃ 𐚁 ${botName}
┗━━━━━━━━━━━━━━━━━━━━━┛

🎵 *Descargando audio:*

╭───────────────────
│ 🎤 *Título:* ${title}
│ 👤 *Canal:* ${channel}
│ ⏱️ *Duración:* ${duration}
│ 👀 *Vistas:* ${views}
│ 📅 *Subido:* ${ago}
│ 🔗 *Link:* ${videoUrl}
╰───────────────────

⏳ *Espere un momento, descargando audio...*`

 if(thumb) await sock.sendMessage(from, { image: { url: thumb }, caption: infoText }, { quoted: m })
 else await sock.sendMessage(from, { text: infoText }, { quoted: m })

 const apiUrl = `https://hikariapi.skyultraweb.com/api/scrapers/youtube/audio?url=${encodeURIComponent(videoUrl)}&quality=128k&apikey=${KEY}`
 const json = await fetch(apiUrl).then(r=>r.json())
 if(!json.success) throw new Error('API fallo')
 const dl = json.data.downloadUrl
 const buffer = Buffer.from(await (await fetch(dl)).arrayBuffer())
 await sock.sendMessage(from, { audio: buffer, mimetype: 'audio/mpeg', fileName: `${title}.mp3` }, { quoted: m })
 }catch(e){
 await sock.sendMessage(from, { text: `❌ Error: ${e.message}` }, { quoted: m })
 }
}
