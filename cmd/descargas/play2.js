import yts from 'yt-search'
import config from '../../config.js'

export const handler = {}
handler.name = 'play2'
handler.alias = ['ytmp4','mp4','ytv','video']
handler.category = 'descargas'
handler.description = 'Descarga video de YouTube'

const KEY = 'hk_live_emalahxKe_Y5yamxR2ysovb70Niz_BUBRFrcq0M4YQA'

handler.exec = async (sock, m) => {
 const from = m.key.remoteJid
 const body = m.message?.conversation || m.message?.extendedTextMessage?.text || ''
 const q = body.trim().split(/ +/).slice(1).join(' ').trim()
 if(!q) return sock.sendMessage(from, { text: 'Usa: .play2 bad bunny dtmf' }, { quoted: m })

 const botName = config.botName || config.name || 'Master Clover'
 try{
 let videoUrl = q
 let video = {}
 if(!q.startsWith('http')){
 const search = await yts(q)
 if(!search.videos.length) throw new Error('Sin resultados')
 video = search.videos[0]
 videoUrl = video.url
 } else {
 const search = await yts(q)
 video = search.videos[0] || {}
 }

 const title = video.title || q
 const channel = video.author?.name || 'YouTube'
 const duration = video.timestamp || 'N/A'
 const views = video.views?.toLocaleString() || 'N/A'
 const ago = video.ago || 'N/A'

 const infoText = `┏━━━━━━━━━━━━━━━━━━━━━┓
┃ 𐚁 ${botName}
┗━━━━━━━━━━━━━━━━━━━━━┛

🎵 *Descargando video:*

╭───────────────────
│ 🎤 *Título:* ${title}
│ 👤 *Canal:* ${channel}
│ ⏱️ *Duración:* ${duration}
│ 👀 *Vistas:* ${views}
│ 📅 *Subido:* ${ago}
│ 🔗 *Link:* ${videoUrl}
╰───────────────────

⏳ *Espere un momento, descargando video...*`

 await sock.sendMessage(from, { text: infoText }, { quoted: m })

 const apiUrl = `https://hikariapi.skyultraweb.com/api/scrapers/youtube/video?url=${encodeURIComponent(videoUrl)}&quality=360p&apikey=${KEY}`
 const json = await fetch(apiUrl).then(r=>r.json())
 if(!json.success) throw new Error('Hikari fallo')

 const dl = json.data.downloadUrl
 const buffer = Buffer.from(await (await fetch(dl)).arrayBuffer())

 await sock.sendMessage(from, { video: buffer, mimetype: 'video/mp4', fileName: `${title}.mp4`, caption: title }, { quoted: m })

 }catch(e){
 await sock.sendMessage(from, { text: `❌ Play2 error: ${e.message}` }, { quoted: m })
 }
}
