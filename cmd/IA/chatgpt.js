export const handler = {}
handler.name = 'ia'
handler.alias = ['chatgpt']
handler.category = 'utils'

handler.exec = async (sock, m) => {
 const from = m.key.remoteJid
 const body = m.message?.conversation || m.message?.extendedTextMessage?.text || ''
 const q = body.trim().split(/ +/).slice(1).join(' ').trim()
 if(!q) return sock.sendMessage(from, { text: 'Usa:.ia hola' }, { quoted: m })
 try {
 let resText = null
 try {
 const r = await fetch('https://ai.siputzx.my.id', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ content: q, user: m.key.participant || from, prompt: 'Eres Anubis, español, divertida. Si piden codigo usa bloque ```js', model: 'gemini' })
 }).then(r=>r.json())
 if(r.result) resText = r.result
 } catch {}
 if(!resText){
 try {
 const r2 = await fetch(`${global.APIs.yuki.url}/ai/gptprompt?text=${encodeURIComponent(q)}&prompt=${encodeURIComponent('Eres Anubis')}&key=${global.APIs.yuki.key}`).then(r=>r.json())
 resText = r2.result?.text || r2.result || r2.results
 } catch {}
 }
 if(!resText) resText = `Recibí: ${q} (API caida pero comando si funciona)`
 const esCodigo = /(codigo|code|empresa|arroz|script|funcion)/i.test(q)
 if(esCodigo){
 await sock.sendMessage(from, { text: "```js\n" + resText + "\n```" }, { quoted: m })
 } else {
 await sock.sendMessage(from, { text: resText }, { quoted: m })
 }
 } catch(e){
 console.log(e)
 await sock.sendMessage(from, { text: `Error: ${e.message}` }, { quoted: m })
 }
}
