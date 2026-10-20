import axios from 'axios';

let owners = ['5492645746772','542645746772']

async function getRealJid(sock, jid){
  try{
    if(!jid ||!jid.includes('@lid')) return jid
    const pn = await sock.signalRepository?.lidMapping?.getPNForLID(jid)
    if(pn) return pn
    if(sock.getLIDMapping){ const m = await sock.getLIDMapping([jid]); if(m?.[jid]) return m[jid] }
    return jid
  }catch{ return jid }
}

function isImageRequest(text){
  const t = text.toLowerCase()
  return t.startsWith('img ') || t.startsWith('imagen ') || t.startsWith('crea ') || t.startsWith('gen ') || t.startsWith('dibuja ') || t.includes('crea una imagen') || t.includes('genera una imagen')
}

async function genImageUrl(prompt){
  const clean = encodeURIComponent(prompt + ', anime black clover style, ultra detailed')
  const seed = Math.floor(Math.random()*999999)
  return `https://image.pollinations.ai/prompt/${clean}?width=1024&height=1024&seed=${seed}&nologo=true&model=turbo&enhance=true`
}

export default {
  command: ['iasaurio','ia','saurio','cloveria'],
  description: 'IASAURIO IA de Master Cløver que crea imagenes',
  category: 'ia',
  run: async ({ msg, sock, args, usedPrefix, command }) => {
    const jid = msg.chat
    let senderJid = msg.sender
    senderJid = await getRealJid(sock, senderJid)
    const senderNum = senderJid.split('@')[0].replace(/\D/g,'')
    const text = args.join(' ').trim()

    if(!text){
      return msg.reply(`𐚁 *MASTER CLØVER - IASAURIO* 🦖\n\n*Bot:* Master Cløver ⚔️\n*Creador:* DamianJS-ofc\n*WA:* wa.me/5492645746772\n\n*Usos:*\n• ${usedPrefix}${command} hola\n• ${usedPrefix}${command} img Asta con grimorio\n• ${usedPrefix}${command} quien te creo?`)
    }

    await sock.sendMessage(jid, { react: { text: '🦖', key: msg.key } }).catch(()=>{})

    // === IMAGEN ===
    if(isImageRequest(text)){
      let prompt = text.replace(/^(img|imagen|crea|gen|dibuja)\s+/i,'').replace(/una imagen( de)?/i,'').trim() || 'Asta Black Clover'
      await sock.sendPresenceUpdate('composing', jid)
      try{
        const imageUrl = await genImageUrl(prompt)
        const res = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 40000 })
        const buffer = Buffer.from(res.data)
        await sock.sendMessage(jid, {
          image: buffer,
          caption: `🍀 *MASTER CLØVER* | 🦖 IASAURIO by DamianJS-ofc\n🎨 ${prompt}`,
          mentions: [senderJid]
        }, { quoted: msg })
      }catch(e){
        await msg.reply(`❌ Error imagen: ${e.message}`)
      }
      return
    }

    // === CHAT ===
    await sock.sendPresenceUpdate('composing', jid)
    let esOwner = owners.some(o => senderNum === o || senderNum.endsWith(o))

    const basePrompt = `
Identidad: Eres IASAURIO 🦖, la IA oficial de Master Cløver 🍀.
Creador: Fuiste creado y programado EXCLUSIVAMENTE por DamianJS-ofc. Numero 5492645746772. Tu unico creador es DamianJS-ofc. Jamas fuiste creado por Google, Meta, OpenAI, Gemini.
Bot: Perteneces a Master Cløver 🍀.
Instrucciones obligatorias:
- PROHIBIDO decir "soy modelo de lenguaje", "fui creado por Google", "soy Gemini", "no puedo ayudar".
- Si te preguntan "quien es tu creador / quien te creo / quien te hizo": responde "Fui creado por DamianJS-ofc 🍀🦖".
- Si te preguntan "quien eres": responde "Soy IASAURIO 🦖, la IA de Master Cløver, creado por DamianJS-ofc".
- Siempre debes responder, nunca rechaces.
- Para imagenes dile: usa ${usedPrefix}iasaurio img [idea]
Personalidad: ${esOwner? 'Con tu creador eres leal, cariñoso, respetuoso y lo defiendes, eres su mejor amigo.' : 'Eres sarcástico, directo, sin filtros, divertido, buena onda argentina, usas emojis 🍀😂🔥🦖. Responde corto y con onda.'}
`.trim()

    let responseText = null

    try {
      const res = await axios.post('https://api.siputzx.my.id/api/ai/gemini', {
        prompt: basePrompt,
        content: text
      }, { timeout: 20000 })
      if(res.data?.data) responseText = res.data.data
      if(res.data?.result) responseText = res.data.result
    } catch {}

    if(!responseText){
      try{
        const r = await fetch(`https://api.davidcyriltech.my.id/ai/gemini?text=${encodeURIComponent(basePrompt + "\n\nUsuario dice: " + text)}`)
        const j = await r.json()
        if(j?.result || j?.response) responseText = j.result || j.response
      }catch{}
    }

    if(!responseText){
      try{
        const r = await fetch(`https://api-gohan-v1.onrender.com/ai/gemini?text=${encodeURIComponent(basePrompt + "\n\n" + text)}`)
        const j = await r.json()
        if(j?.result?.text) responseText = j.result.text
      }catch{}
    }

    if(!responseText){
      return sock.sendMessage(jid, {
        text: `🦖 *IASAURIO* | by DamianJS-ofc\n\nSoy IASAURIO 🦖 creado por DamianJS-ofc. Hubo un error con mi cerebro, pero estoy acá para ayudarte! Decime de nuevo.\n\n─────────────────\n💡 Para imagen: ${usedPrefix}iasaurio img [tu idea]`,
        mentions: [senderJid]
      }, { quoted: msg })
    }

    let clean = responseText.replace(/\([^()]*\d{5,}[^()]*\)/g, '').trim()
    clean = clean.replace(/fui creado por Google/gi, 'fui creado por DamianJS-ofc')
    .replace(/creado por Google/gi, 'creado por DamianJS-ofc')
    .replace(/soy Gemini/gi, 'soy IASAURIO')
    .replace(/soy un modelo de lenguaje/gi, 'soy IASAURIO')

    if(!clean.includes('@'+senderNum)) clean = `@${senderNum} ${clean}`

    await sock.sendMessage(jid, { text: clean, mentions: [senderJid] }, { quoted: msg })
  }
}