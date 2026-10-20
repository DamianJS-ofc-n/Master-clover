import fetch from 'node-fetch'

export const handler = {}
handler.name='acortar'
handler.alias=['short','acortarlink']
handler.category='utiles'
handler.description='Acortador moderno'

handler.exec = async (sock,m,a)=>{
  const chatId=m.key.remoteJid
  const url = a[0]?.trim()

  if(!url ||!url.startsWith('http')){
    return sock.sendMessage(chatId,{
      text:`𐚁 *Acortador 〾 Master Clover*

✐ *Uso ›*.acortar <link>
🌀 *Ejemplos ›*
•.acortar https://chat.whatsapp.com/Abc123XyZ
•.acortar https://whatsapp.com/channel/0029Vb7...
•.acortar https://nexus-club-web.netlify.app

📢 *Nota ›* Funciona con grupos, canales y cualquier link.`
    }, {quoted:m})
  }

  await sock.sendMessage(chatId, { react: { text: "🌀", key: m.key } })

  try{
    const res = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(url)}`)
    const data = await res.json()
    let short = data.shorturl

    if(!short){
      const r2 = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`)
      short = await r2.text()
    }

    const text = `𐚁 *Link Acortado Correctamente*

✐ *Original ›*
${url}

🌀 *Acortado ›*
${short}

📢 *Info ›* El enlace sigue funcionando al 100%, compatible con grupos y canales de WhatsApp.

𐚁 *Master Clover System*`

    await sock.sendMessage(chatId, { text }, { quoted:m})

  }catch(e){
    await sock.sendMessage(chatId,{
      text:`𐚁 *Error*

✐ No se pudo acortar el link
📢 Verifica que el link sea válido e intentalo de nuevo.`
    }, {quoted:m})
  }
}