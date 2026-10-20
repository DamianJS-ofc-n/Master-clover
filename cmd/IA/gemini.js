let geminiSessions = {}

async function getRealJid(sock, jid){
 try{
 if(!jid ||!jid.includes('@lid')) return jid
 const pn = await sock.signalRepository?.lidMapping?.getPNForLID(jid)
 if(pn) return pn
 if(sock.getLIDMapping){
 const map = await sock.getLIDMapping([jid])
 if(map?.[jid]) return map[jid]
 }
 return jid
 }catch{ return jid }
}

const gemini = {
 getNewCookie: async function() {
 const res = await fetch('https://gemini.google.com/_/BardChatUi/data/batchexecute?rpcids=maGuAc&source-path=%2F&bl=boq_assistant-bard-web-server_20250814.06_p1&f.sid=-7816331052118000090&hl=en-US&_reqid=173780&rt=c', {
 headers: { 'content-type': 'application/x-www-form-urlencoded;charset=UTF-8' },
 body: 'f.req=%5B%5B%5B%22maGuAc%22%2C%22%5B0%5D%22%2Cnull%2C%22generic%22%5D%5D%5D&',
 method: 'POST'
 })
 const cookie = res.headers.get('set-cookie')
 if(!cookie) throw new Error('No se encontró la cookie')
 return cookie.split(';')[0]
 },
 ask: async function(prompt, prevId = null) {
 let newResumeArray = null, cookie = null
 if(prevId) {
 try { const d = JSON.parse(atob(prevId)); newResumeArray = d.newResumeArray; cookie = d.cookie } catch { prevId = null }
 }
 const headers = {
 'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
 'x-goog-ext-525001261-jspb': '[1,null,null,null,"9ec249fc9ad08861",null,null,null,[4]]',
 'cookie': cookie || await this.getNewCookie()
 }
 const bodyData = [[prompt], ["es-ES"], newResumeArray]
 const fReq = [null, JSON.stringify(bodyData)]
 const params = new URLSearchParams({ 'f.req': JSON.stringify(fReq) })
 const res = await fetch('https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate?bl=boq_assistant-bard-web-server_20250729.06_p0&f.sid=4206607810970164620&hl=es-ES&_reqid=2813378&rt=c', { headers, body: params, method: 'POST' })
 if(!res.ok) throw new Error(await res.text() || '(Respuesta vacía)')
 const text = await res.text()
 const matches = [...text.matchAll(/^\d+\n(.+?)\n/gm)]
 const chunks = Array.from(matches, m => m[1])
 let finalText, resumeArray
 for(const c of chunks.reverse()){
 try{
 const parsed = JSON.parse(c)
 const inner = JSON.parse(parsed[0][2])
 if(inner?.[4]?.[0]?.[0]?.[1] && typeof inner[4][0][0][1][0] === 'string'){
 resumeArray = [...inner[1], inner[4][0][0]]
 finalText = inner[4][0][0][1][0].replace(/\*\*(.+?)\*\*/g, '*$1*')
 break
 }
 }catch{}
 }
 if(!finalText) throw new Error('No se pudo interpretar la respuesta')
 const id = btoa(JSON.stringify({ newResumeArray: resumeArray, cookie: headers.cookie }))
 return { text: finalText, id }
 }
}

export default {
 name: 'gemini',
 alias: ['ia','gemi'],
 tags: ['ia'],
 exec: async (sock, msg, args) => {
 const jid = msg.key.remoteJid
 let sender = msg.key.participant || jid
 sender = await getRealJid(sock, sender)
 const text = args.join(' ')
 if(!text) return sock.sendMessage(jid, { text: `✿ Ingresa un prompt.\nEjemplo:.gemini capital de Australia?` }, { quoted: msg })
 if(text.toLowerCase() === '--reset') {
 delete geminiSessions[sender]
 return sock.sendMessage(jid, { text: '✎ Historial reiniciado.' }, { quoted: msg })
 }
 try {
 await sock.sendMessage(jid, { react: { text: '🤔', key: msg.key } })
 const result = await gemini.ask(text, geminiSessions[sender])
 geminiSessions[sender] = result.id
 await sock.sendMessage(jid, { text: result.text }, { quoted: msg })
 await sock.sendMessage(jid, { react: { text: '✔️', key: msg.key } })
 } catch(e) {
 console.log(e)
 await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } })
 await sock.sendMessage(jid, { text: `✘ Error: ${e.message}` }, { quoted: msg })
 }
 }
}
