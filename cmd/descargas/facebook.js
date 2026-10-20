export const handler = {}
handler.name = 'facebook'
handler.alias = ['fb','fbdl','facebookdl']
handler.category = 'descargas'

const KEY_HIKARI = 'hk_live_emalahxKe_Y5yamxR2ysovb70Niz_BUBRFrcq0M4YQA'
const KEY_LEMPI = 'Anubis_bott_pro'
import config from '../../config.js'

handler.exec = async (sock, m) => {
  const from = m.key.remoteJid
  const body = m.message?.conversation || m.message?.extendedTextMessage?.text || ''
  const q = body.trim().split(/ +/).slice(1).join(' ').trim()
  if(!q) return sock.sendMessage(from, { text: '𐚁 Usa: *.fb https://www.facebook.com/reel/...*' }, { quoted: m })

  const botName = config.botName || config.name || 'Master Clover'

  try{
    let dlUrl = null
    let title = 'Facebook Video'
    let views = 'N/A'

    // INTENTO 1: Hikari
    try{
      const apiUrl = `https://hikariapi.skyultraweb.com/api/scrapers/facebook?url=${encodeURIComponent(q)}&apikey=${KEY_HIKARI}`
      const j = await fetch(apiUrl).then(r=>r.json())
      if(j.success) dlUrl = j.downloadUrl || j.data?.downloadUrl
    }catch{}

    // INTENTO 2: Lempi / Dorratz como respaldo
    if(!dlUrl){
      try{
        const api2 = `https://api.lempi.lat/dl/facebook?url=${encodeURIComponent(q)}&apikey=${KEY_LEMPI}`
        const j2 = await fetch(api2).then(r=>r.json())
        dlUrl = j2.data?.hd || j2.data?.sd || j2.result?.hd || j2.url || j2.downloadUrl
        title = j2.title || j2.data?.title || title
      }catch{}
    }

    // INTENTO 3: API publica de respaldo
    if(!dlUrl){
      try{
        const api3 = `https://api.dorratz.com/fbvideo?url=${encodeURIComponent(q)}`
        const j3 = await fetch(api3).then(r=>r.json())
        dlUrl = j3.result?.hd || j3.result?.sd || j3.result?.url
      }catch{}
    }

    if(!dlUrl) throw new Error('Todas las APIs fallaron, Facebook esta bloqueando. Intenta con un link publico de fb.watch')

    const infoText = `┏━━━━━━━━━━━━━━━━━━━━━┓
┃ 𐚁 ${botName}
┗━━━━━━━━━━━━━━━━━━━━━┛

📘 *Facebook Downloader:*

╭───────────────────
│ 🎬 *Título:* ${title}
│ 👀 *Vistas:* ${views}
│ 🔗 *Link:* ${q}
╰───────────────────

⏳ *Espere un momento...*`

    await sock.sendMessage(from, { text: infoText }, { quoted: m })

    const buffer = Buffer.from(await (await fetch(dlUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } })).arrayBuffer())
    await sock.sendMessage(from, { video: buffer, mimetype: 'video/mp4', fileName: 'facebook.mp4' }, { quoted: m })

  }catch(e){
    await sock.sendMessage(from, { text: `𐚁 *Error FB*\n\n✐ ${e.message}` }, { quoted: m })
  }
}