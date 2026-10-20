export const handler = {}
handler.name = 'damelid'
handler.alias = ['getid','myid','id','lid']
handler.category = 'utiles'
handler.description = 'Ver LID y número real del mencionado'

handler.exec = async (sock, m, a) => {
 let jid = m.key.remoteJid
 let sender = m.key.participant || m.key.remoteJid

 let args = Array.isArray(a)? a : (a?.args || [])

 // AGARRA MENCIONES DE TODOS LADOS
 let mentioned = []
 mentioned = mentioned.concat(m.mentionedJid || [])
 mentioned = mentioned.concat(m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [])
 mentioned = mentioned.concat(m.message?.imageMessage?.contextInfo?.mentionedJid || [])
 mentioned = mentioned.concat(m.message?.videoMessage?.contextInfo?.mentionedJid || [])
 mentioned = mentioned.concat(m.message?.documentMessage?.contextInfo?.mentionedJid || [])
 // Quita duplicados
 mentioned = [...new Set(mentioned)]

 let quoted = m.message?.extendedTextMessage?.contextInfo?.participant || m.quoted?.participant || null

 // Si escribe.damelid 549... también lo cuenta
 let manualNumber = args.find(x => /^\d{7,15}$/.test(x))
 if(manualNumber &&!mentioned.length){
 mentioned = [manualNumber + '@s.whatsapp.net']
 }

 let text = `🆔 *DAMELID*\n\n`

 if(mentioned.length > 0){
 text += `👤 *Mencionado(s) ${mentioned.length}:*\n`
 for(let id of mentioned){
 let num = id.split('@')[0].split(':')[0]
 text += `├ ID: ${id}\n`
 text += `├ LID? ${id.includes('@lid')? 'SI - es LID' : 'NO - es número real'}\n`
 text += `└ Número: +${num}\n\n`
 }
 } else if(quoted){
 let num = quoted.split('@')[0].split(':')[0]
 text += `💬 *Respondiste a:*\n`
 text += `├ ID: ${quoted}\n`
 text += `├ LID? ${quoted.includes('@lid')? 'SI' : 'NO'}\n`
 text += `└ Número: +${num}\n\n`
 } else {
 text += `👤 *Tú (el que ejecutó):*\n`
 let num = sender.split('@')[0].split(':')[0]
 text += `├ ID: ${sender}\n`
 text += `└ Número: +${num}\n\n`
 text += `👥 *Chat:* ${jid}\n\n`
 text += `> Para sacar el ID de otro:\n>.damelid @mencion o responde a su mensaje`
 }

 await sock.sendMessage(jid, { text, mentions: mentioned }, { quoted: m })
}
