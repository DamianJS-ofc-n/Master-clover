import fs from 'fs'
export const handler = {}
handler.name = 'username'
handler.alias = ['usrnm','getpn']
handler.category = 'fun'
handler.description = 'Busca el numero real por username LID'

handler.exec = async (sock, m, args) => {
 try{
 const jid = m.key.remoteJid
 const text = (args.join(' ') || '').replace('@','').trim().toLowerCase()
 if(!text){
 return sock.sendMessage(jid,{text:'Uso: .usrnm <username>\nEj: .usrnm michimiauofcpe'},{quoted:m})
 }

 let targetLid = null
 let phoneNumber = null

 if(text.includes('@lid')) targetLid = text

 if(!targetLid){
 try{
 const groups = await sock.groupFetchAllParticipating()
 const allParts = Object.values(groups).flatMap(g=>g.participants||[])
 for(const p of allParts){
 if(p.username && p.username.toLowerCase() === text){
 targetLid = p.id
 if(p.phoneNumber) phoneNumber = p.phoneNumber
 break
 }
 }
 }catch{}
 }

 if(!targetLid){
 return sock.sendMessage(jid,{text:`❌ Username *${text}* no encontrado en tus grupos.`},{quoted:m})
 }

 if(!phoneNumber){
 try{
 const pn = await sock.signalRepository?.lidMapping?.getPNForLID(targetLid)
 if(pn) phoneNumber = pn
 }catch{}
 }

 if(!phoneNumber){
 try{
 const res = await sock.onWhatsApp(targetLid)
 if(res?.[0]?.jid) phoneNumber = res[0].jid
 }catch{}
 }

 if(phoneNumber){
 return sock.sendMessage(jid,{text:`📢 Username *${text}* encontrado.\nLID: ${targetLid}\n📱 PN: ${phoneNumber}\nNumero: ${phoneNumber.split('@')[0]}`},{quoted:m})
 }else{
 return sock.sendMessage(jid,{text:`🌀 Username *${text}* encontrado.\nLID: ${targetLid}\n❌ PhoneNumber: no disponible (LID privado)`},{quoted:m})
 }

 }catch(e){
 console.log('[USRN M]', e)
 return sock.sendMessage(m.key.remoteJid,{text:`Error: ${e.message}`},{quoted:m})
 }
}