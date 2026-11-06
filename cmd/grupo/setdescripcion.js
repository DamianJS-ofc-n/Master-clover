export const handler = {}
handler.name = 'setdescripcion'
handler.alias = ['setdescgrupo', 'setdescgpo', 'descripcion']
handler.category = 'Admin'

handler.exec = async (sock, m, args) => {
 let jid = m.key.remoteJid
 if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: `《✧》 Solo en grupos.` }, { quoted: m })

 let metadata = await sock.groupMetadata(jid)
 let senderIds = [m.key.participant, m.key.participantAlt, m.participant, m.sender].filter(Boolean)
 let senderP = metadata.participants.find(p => senderIds.includes(p.id) || senderIds.includes(p.lid) || senderIds.includes(p.phoneNumber))
 let isSenderAdmin = senderP && (senderP.admin === 'admin' || senderP.admin === 'superadmin')
 if (!isSenderAdmin) return sock.sendMessage(jid, { text: `《✧》 No eres admin.` }, { quoted: m })

 // FIX: no usar args, leer el texto crudo para no perder saltos de linea
 let raw = m.message?.conversation || m.message?.extendedTextMessage?.text || m.message?.imageMessage?.caption || ''
 // Quitar el comando .setdescripcion / .descripcion etc
 let desc = raw.replace(/^\s*[.\/!#]?setdescripcion\b/i, '').replace(/^\s*[.\/!#]?setdescgrupo\b/i, '').replace(/^\s*[.\/!#]?setdescgpo\b/i, '').replace(/^\s*[.\/!#]?descripcion\b/i, '').trim()
 // Fallback si raw viene vacio, usar args
 if (!desc && args?.length) desc = args.join(' ').trim()
 // Si todavia viene con el comando pegado en la primera linea, quitar primera linea
 if (!desc) return sock.sendMessage(jid, { text: `《✧》 Uso: .setdescripcion Nueva descripción del grupo` }, { quoted: m })

 // WhatsApp corta la descripcion a 2048
 if (desc.length > 2048) desc = desc.slice(0, 2048)

 try {
 let ok = false
 let lastErr = null
 // Metodo 1: Baileys clasico
 try { await sock.groupUpdateDescription(jid, desc); ok = true } catch(e){ lastErr = e; console.log('[DESC 1]', e.message) }
 // Metodo 2: algunos forks piden objeto
 if (!ok) {
 try { await sock.groupUpdateDescription(jid, { description: desc }); ok = true } catch(e){ lastErr = e; console.log('[DESC 2]', e.message) }
 }
 // Metodo 3: updateGroupDescription
 if (!ok && sock.updateGroupDescription) {
 try { await sock.updateGroupDescription(jid, desc); ok = true } catch(e){ lastErr = e; console.log('[DESC 3]', e.message) }
 }
 if (!ok) throw lastErr || new Error('No se pudo actualizar')

 await sock.sendMessage(jid, { text: `✐ Descripción actualizada.` }, { quoted: m })
 } catch(e){
 console.log('[SETDESCRIPCION]', e)
 await sock.sendMessage(jid, { text: `❌ No pude cambiar la descripción: ${e.message}\n¿El bot es admin?` }, { quoted: m })
 }
}
export default handler
