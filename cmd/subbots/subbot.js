import fs from 'fs'
const PATH = './db/sub_enabled.json'
function load(){ try{ if(fs.existsSync(PATH)) return JSON.parse(fs.readFileSync(PATH,'utf-8')) }catch{} return {} }
function save(d){ try{ if(!fs.existsSync('./db')) fs.mkdirSync('./db',{recursive:true}); fs.writeFileSync(PATH, JSON.stringify(d,null,2)) }catch{} }
function cleanNumber(raw){ if(!raw) return ''; let s=String(raw); if(s.includes('@')) s=s.split('@')[0]; if(s.includes(':')) s=s.split(':')[0]; return s.replace(/\D/g,'') }
export const handler = {}
handler.name = 'sbot'
handler.alias = ['bot','subbot','boton','botoff']
handler.category = 'sub'
handler.description = 'Activa o desactiva el sub-bot en el grupo'
handler.exec = async (sock, m, args, extra) => {
  const jid = m.key.remoteJid
  if(!jid.endsWith('@g.us')) return await sock.sendMessage(jid,{text:'❌ Solo en grupos'},{quoted:m})
  if(!extra.isSubBot) return await sock.sendMessage(jid,{text:'❌ Solo sub-bots. El principal siempre está ON.'},{quoted:m})
  if(!extra.isOwner &&!extra.isSelf) return await sock.sendMessage(jid,{text:'❌ Solo el owner del sub-bot'},{quoted:m})
  const action = (args[0]||'').toLowerCase()
  const myNum = cleanNumber(sock.user?.id || '')
  const data = load()
  if(!data[myNum]) data[myNum] = {}
  if(['on','enable','activar','encender'].includes(action)){
    data[myNum][jid] = true
    save(data)
    await sock.sendMessage(jid,{text:`✅ *Sub-bot ACTIVADO*`},{quoted:m})
  }else if(['off','disable','desactivar','apagar'].includes(action)){
    data[myNum][jid] = false
    save(data)
    await sock.sendMessage(jid,{text:`⚠️ *Sub-bot DESACTIVADO*\n> Para volver: *.bot on*`},{quoted:m})
  }else{
    const isOff = data[myNum]?.[jid]===false
    const estado = isOff? '❌ APAGADO' : '✅ ENCENDIDO'
    await sock.sendMessage(jid,{text:`╭─ *BOT CONTROL*\n│ Estado: ${estado}\n╰─\n\n*.bot on* para activar\n*.bot off* para desactivar`},{quoted:m})
  }
}