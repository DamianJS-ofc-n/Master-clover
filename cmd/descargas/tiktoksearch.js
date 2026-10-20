export const handler = {}
handler.name = 'tiktoksearch'
handler.alias = ['ttsearch','tts']
handler.category = 'busquedas'

const KEY = 'hk_live_emalahxKe_Y5yamxR2ysovb70Niz_BUBRFrcq0M4YQA'
const BASE_SEARCH = 'https://hikariapi.skyultraweb.com/api/scrapers/tiktok/search'
const BASE_DL = 'https://hikariapi.skyultraweb.com/api/scrapers/tiktok/download'

handler.exec = async (sock, m) => {
  const from = m.key.remoteJid
  const body = m.message?.conversation || m.message?.extendedTextMessage?.text || ''
  const q = body.trim().split(/ +/).slice(1).join(' ').trim()
  if(!q) return sock.sendMessage(from, { text: '𐚁 Usa:.ttsearch editsdeya' }, { quoted: m })

  try {
    const sUrl = `${BASE_SEARCH}?q=${encodeURIComponent(q)}&limit=5&apikey=${KEY}`
    const sJson = await fetch(sUrl).then(r=>r.json())
    if(!sJson.success || !sJson.data?.length) throw new Error('Sin resultados')

    const list = sJson.data.slice(0,5)
    await sock.sendMessage(from, { text: `𐚁 *TikTok Search*\n\n✐ *Busqueda ›* ${q}\n🌀 *Encontrados ›* ${list.length}` }, { quoted: m })

    for(let i=0;i<list.length;i++){
      const v = list[i]
      try{
        const dlUrl = `${BASE_DL}?url=${encodeURIComponent(v.url)}&apikey=${KEY}`
        const dJson = await fetch(dlUrl).then(r=>r.json())
        const videoDirect = dJson.data?.downloadUrl || dJson.data?.video || dJson.data?.play || dJson.data?.hdplay
        if(!videoDirect) continue

        const buf = Buffer.from(await (await fetch(videoDirect)).arrayBuffer())
        const cap = i===0 ? `𐚁 *${q}* - ${i+1}/${list.length}\n✐ ${v.title?.slice(0,100) || ''}\n🌀 @${v.username}` : ''
        await sock.sendMessage(from, { video: buf, mimetype: 'video/mp4', caption: cap }, { quoted: m })
      }catch(e){ continue }
    }

  } catch(e){
    await sock.sendMessage(from, { text: `𐚁 *Error*\n\n✐ ${e.message}` }, { quoted: m })
  }
}