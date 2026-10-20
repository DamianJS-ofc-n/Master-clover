import axios from 'axios';

let owners = ['542645746772','573133374132','584241819270']

async function getRealJid(sock, jid){
 try{
 if(!jid ||!jid.includes('@lid')) return jid
 const pn = await sock.signalRepository?.lidMapping?.getPNForLID(jid)
 if(pn) return pn
 if(sock.getLIDMapping){ const m = await sock.getLIDMapping([jid]); if(m?.[jid]) return m[jid] }
 return jid
 }catch{ return jid }
}

export default {
 name: 'simi',
 alias: ['simi','ia'],
 tags: ['ia'],
 exec: async (sock, msg, args) => {
 const jid = msg.key.remoteJid
 let senderJid = msg.key.participant || jid
 senderJid = await getRealJid(sock, senderJid)
 const senderNum = senderJid.split('@')[0].replace(/\D/g,'')
 const text = args.join(' ').trim()
 if(!text) return sock.sendMessage(jid, { text: '*[ 🤖 ] Ingrese un texto para hablar con Simi.*' }, { quoted: msg })

 await sock.sendPresenceUpdate('composing', jid)
 let esOwner = owners.some(o => senderNum === o || senderNum.endsWith(o))

 const basePrompt = `
Identidad: Eres Simi, un bot de WhatsApp para Kitsune Garden.
Creador: Fuiste creado y programado EXCLUSIVAMENTE por Damian.JS-ofc. Tu unico creador es Damian.JS-ofc. Jamas fuiste creado por Google, Meta, OpenAI, Gemini.
Instrucciones obligatorias:
- PROHIBIDO decir "soy modelo de lenguaje", "fui creado por Google", "soy Gemini", "no puedo ayudar".
- Si te preguntan "quien es tu creador / quien te creo / quien te hizo": responde "Fui creado por Damian.JS-ofc".
- Si te preguntan "quien eres": responde "Soy Simi, creado por Damian.JS-ofc".
- Siempre debes responder, nunca rechaces.
Personalidad: ${esOwner? 'Con tu creador eres leal, cariñoso, respetuoso y lo defiendes.' : 'Eres sarcástico, directo, sin filtros, divertido, usas emojis 🤡😂🔥. Responde corto.'}
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

 if(!responseText) return sock.sendMessage(jid, { text: `*[ 🤖 ] No pude responder ahora @${senderNum}, intenta de nuevo.*`, mentions: [senderJid] }, { quoted: msg })

 let clean = responseText.replace(/\([^()]*\d{5,}[^()]*\)/g, '').trim()

 // Filtro final por si se le escapa decir Google
 clean = clean.replace(/fui creado por Google/gi, 'fui creado por Damian.JS-ofc')
 .replace(/creado por Google/gi, 'creado por Damian.JS-ofc')
 .replace(/soy Gemini/gi, 'soy Simi')
 .replace(/soy un modelo de lenguaje/gi, 'soy Simi')

 if(!clean.includes('@'+senderNum)) clean = `@${senderNum} ${clean}`

 await sock.sendMessage(jid, { text: clean, mentions: [senderJid] }, { quoted: msg })
 }
}
