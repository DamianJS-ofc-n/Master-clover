import config from '../../config.js'
import { getPairingCode, getPrincipal, getPrincipals, removePrincipal, waitForPrincipalConnection } from '../../lib/principals.js'

export const handler = {}
handler.name = 'codemod'
handler.alias = ['addprincipal','modcode','addmod']
handler.category = 'owner'
handler.owner = true

const clean = (n='') => String(n).split('@')[0].split(':')[0].replace(/\D/g,'')
function getOwners(){ return (config?.bot?.owner||[]).map(n=>n.toString().split('@')[0].replace(/\D/g,'')).filter(Boolean) }
function isOwnerDirect(m){
 let raw = m.key?.participant || m.key?.remoteJid || ''
 let c = raw.split('@')[0].split(':')[0].replace(/\D/g,'')
 if(m.key?.fromMe) return true
 return getOwners().includes(c)
}

function normalizeTarget(target){
 if(!target) return ''
 let t = clean(target)
 if(t.length===14 && t.startsWith('54') && t.endsWith('0')) t = t.slice(0,-1)
 return t
}

handler.exec = async (sock, m) => {
 const jid = m.key.remoteJid
 const body = m.message?.conversation || m.message?.extendedTextMessage?.text || ''
 const args = body.trim().split(/\s+/).slice(1)

 if(!isOwnerDirect(m)) return sock.sendMessage(jid, { text: '⚠️ Solo owners pueden usar esto.' }, { quoted: m })

 const subCmd = (args[0]||'').toLowerCase()
 const prefix = config.bot?.prefix || '.'

 if(subCmd === 'list'){
 const { default: fs } = await import('fs')
 const { default: path } = await import('path')
 const root = path.join(process.cwd(),'principals')
 if(!fs.existsSync(root)) return sock.sendMessage(jid,{text:'No hay principals'},{quoted:m})
 let dirs = fs.readdirSync(root).filter(d=>{ try{ return fs.statSync(path.join(root,d)).isDirectory() }catch{ return false } })
 if(!dirs.length) return sock.sendMessage(jid,{text:'No hay principals'},{quoted:m})
 let txt = `*PRINCIPALS CONECTADOS:* ${dirs.length}\n\n`
 for(let d of dirs) txt += `• +${d}\n`
 return sock.sendMessage(jid,{text:txt},{quoted:m})
 }

 if(subCmd === 'del' || subCmd === 'remove'){
 const num = clean(args[1]||'')
 if(!num) return sock.sendMessage(jid,{text:`Uso: ${prefix}codemod del 5199999999`},{quoted:m})
 removePrincipal(num)
 return sock.sendMessage(jid,{text:`✅ Principal +${num} eliminado`},{quoted:m})
 }

 let target = normalizeTarget(args[0]||'')
 if(!target || !/^\d{7,15}$/.test(target)){
 return sock.sendMessage(jid,{text:`*Uso:*\n${prefix}codemod 51999999999\n${prefix}codemod list\n${prefix}codemod del 5199`},{quoted:m})
 }

 const existing = getPrincipal(target)
 if(existing?.sock?.authState?.creds?.registered === true && existing.sock.user && existing.sock.ws?.isOpen){
 return sock.sendMessage(jid, { text: `✅ ${target} ya está vinculado como PRINCIPAL` }, { quoted: m })
 }

 await sock.sendMessage(jid, { text: `⏳ Generando código PRINCIPAL para ${target}...` }, { quoted: m })

 try{
 const result = await getPairingCode(target, {})
 if(result.status === 'connected'){
 return sock.sendMessage(jid, { text: `✅ ${target} ya está vinculado` }, { quoted: m })
 }
 if(result.status === 'timeout'){
 removePrincipal(target)
 return sock.sendMessage(jid, { text: `⏱️ No se pudo generar el código a tiempo para ${target}. Intentá de nuevo.` }, { quoted: m })
 }
 if(result.status === 'pending' && result.code){
 await sock.sendMessage(jid, { text: `ㅤ ロ⃝ ❀ \`Principal masters\` ᗤᗤ\n*Conecta un Principal para » ${target}*\n\n🥷 *Pasos*\n⚔️ 1️⃣ *Abre WhatsApp » Ajustes*\n⚔️ 2️⃣ *Dispositivos vinculados*\n⚔️ 3️⃣ *Vincular con número*\n⚔️ 4️⃣ *Pegá el código de abajo*\n\n> Expira en 60 segundos` }, { quoted: m })
 await sock.sendMessage(jid, { text: `*${result.code}*` }, { quoted: m })
 waitForPrincipalConnection(target, 180000).then(async(ok)=>{
 if(ok) try{ await sock.sendMessage(jid, { text: `✅ PRINCIPAL +${target} CONECTADO` }, { quoted: m }) }catch{}
 }).catch(()=>{})
 return
 }
 await sock.sendMessage(jid, { text: `❌ No se pudo generar el código para ${target}. Intentá de nuevo.` }, { quoted: m })
 }catch(e){
 console.log('[CODEMOD ERROR]', e)
 await sock.sendMessage(jid, { text: `❌ Error: ${e.message}\nEj: ${prefix}codemod 5492645746772` }, { quoted: m })
 }
}
export default handler
