import fs from 'fs'

export const handler = {}
handler.name = 'setprimary'
handler.alias = ['setp','primary','setprincipal']
handler.category = 'subbots'

const PRIMARY_PATH = './db/primary.json'
const clean = n => String(n||'').replace(/\D/g,'')

function loadPrimary(){
 try{ if(fs.existsSync(PRIMARY_PATH)) return JSON.parse(fs.readFileSync(PRIMARY_PATH,'utf8')) }catch{}
 return {}
}
function savePrimary(d){ try{ fs.writeFileSync(PRIMARY_PATH, JSON.stringify(d,null,2)) }catch{} }

handler.exec = async (sock, m, args) => {
 let jid = m.key.remoteJid
 if (!jid.endsWith('@g.us')) return await sock.sendMessage(jid,{text:'Solo grupos'},{quoted:m})

 let metadata = await sock.groupMetadata(jid)
 let participants = metadata.participants
 let sender = m.key.participant || m.participant || ''

 let senderP = participants.find(p => p.id === sender || p.lid === sender)
 let isSenderAdmin = senderP && (senderP.admin === 'admin' || senderP.admin === 'superadmin')
 let isOwner = false
 try{
 const { default: config } = await import('../../config.js')
 const owners = [].concat(config.bot?.owner || config.owner || []).map(o=>clean(o))
 if(owners.includes(clean(sender))) isOwner = true
 }catch{}
 if (!isSenderAdmin && !isOwner) return await sock.sendMessage(jid, { text: `《✧》 Solo admins` }, { quoted: m })

 const sub = (args[0]||'').toLowerCase()
 if(sub === 'off' || sub === 'reset'){ let d=loadPrimary(); delete d[jid]; savePrimary(d); return await sock.sendMessage(jid,{text:'✅ Primary desactivado'},{quoted:m}) }
 if(sub === 'list'){ let d=loadPrimary(); return await sock.sendMessage(jid,{text: d[jid] ? `👑 Principal: +${d[jid]}` : 'No hay principal'},{quoted:m}) }

 // === CAPTURAR MENCION DE TODOS LADOS ===
 let rawMention = null
 // 1. Baileys nuevo
 if(m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) rawMention = m.message.extendedTextMessage.contextInfo.mentionedJid[0]
 // 2. Contexto directo
 if(!rawMention && m.message?.extendedTextMessage?.contextInfo?.participant) rawMention = m.message.extendedTextMessage.contextInfo.participant
 // 3. Propiedad directa del mensaje
 if(!rawMention && m.mentionedJid?.[0]) rawMention = m.mentionedJid[0]
 // 4. En el msg base
 if(!rawMention && m.message?.contextInfo?.mentionedJid?.[0]) rawMention = m.message.contextInfo.mentionedJid[0]
 // 5. Citado / extended
 const ext = m.message?.extendedTextMessage || {}
 const ctx = ext.contextInfo || m.message?.imageMessage?.contextInfo || m.message?.videoMessage?.contextInfo || {}
 if(!rawMention && ctx.mentionedJid?.[0]) rawMention = ctx.mentionedJid[0]
 if(!rawMention && ctx.participant) rawMention = ctx.participant

 let target = null
 let displayMention = rawMention || 'no detectada'

 if(rawMention){
 // Buscar participante real
 let p = participants.find(x => x.id === rawMention || x.lid === rawMention || x.id?.split('@')[0] === rawMention.split('@')[0] || x.lid?.split('@')[0] === rawMention.split('@')[0])
 if(p){
 // PRIORIDAD: phoneNumber real
 if(p.phoneNumber && clean(p.phoneNumber).length >= 8) target = clean(p.phoneNumber)
 else if(p.id && !p.id.endsWith('@lid')) target = clean(p.id)
 else target = clean(p.lid || rawMention)
 } else {
 target = clean(rawMention)
 }
 }

 if(!target && args[0]) target = clean(args[0])
 if(!target) return await sock.sendMessage(jid,{text:`Menciona a un bot:\n.setprimary @bot\nRaw detectado: ${displayMention}`},{quoted:m})

 // Verificar que exista
 let found = false
 let realPhone = null
 for(let p of participants){
 let phones = [clean(p.phoneNumber||''), clean(p.id||''), clean(p.lid||'')].filter(Boolean)
 if(phones.includes(target) || phones.some(n=> n.endsWith(target) || target.endsWith(n))){
 found = true
 realPhone = clean(p.phoneNumber || p.id || p.lid)
 if(p.phoneNumber) realPhone = clean(p.phoneNumber)
 break
 }
 }

 if(!found){
 return await sock.sendMessage(jid,{text:`❌ +${target} no está en el grupo\nMención raw: ${rawMention}`},{quoted:m})
 }

 let toSave = realPhone || target
 // Si es LID muy largo, buscar su phoneNumber
 if(toSave.length > 15){
 let pp = participants.find(x => clean(x.lid) === toSave || clean(x.id) === toSave)
 if(pp?.phoneNumber) toSave = clean(pp.phoneNumber)
 }

 let d = loadPrimary()
 d[jid] = clean(toSave)
 savePrimary(d)
 await sock.sendMessage(jid,{text:`✅ Ahora el principal es +${clean(toSave)}\nMencionaste: ${rawMention}\nTarget final: +${clean(toSave)}`},{quoted:m})
}
