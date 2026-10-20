export const handler = {}
handler.name = 'voz'
handler.alias = ['tts','say']
handler.category = 'audio'
handler.exec = async (sock, m) => {
 const from = m.key.remoteJid
 const body = m.message?.conversation || m.message?.extendedTextMessage?.text || ''
 let text = body.trim().split(/ +/).slice(1).join(' ').trim()
 if(text.toLowerCase().startsWith('enrique')) text = text.slice(7).trim()
 if(text.toLowerCase().startsWith('jorge')) text = text.slice(5).trim()
 if(!text) return sock.sendMessage(from, { text: 'Usa:.tts hola mundo' }, { quoted: m })
 text = text.replace(/[<>&]/g, '').slice(0,300)
 try {
 const data = await fetch(`https://api.lempi.lat/s/ttsmp3?text=${encodeURIComponent(text)}&speaker=Jorge%20(Castilian)&apikey=Anubis_bott_pro`).then(r=>r.json())
 const audioUrl = data.datos?.audioUrl
 if(!audioUrl) throw new Error('Sin audio')
 const buf = Buffer.from(await (await fetch(audioUrl)).arrayBuffer())
 await sock.sendMessage(from, { audio: buf, mimetype: 'audio/mpeg', ptt: false }, { quoted: m })
 } catch(e){ await sock.sendMessage(from, { text: `Error: ${e.message}` }, { quoted: m }) }
}
