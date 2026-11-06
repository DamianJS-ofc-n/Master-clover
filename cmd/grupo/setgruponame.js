export const handler = {}
handler.name = 'setgruponame'
handler.alias = ['setnamegrupo', 'setnombre', 'nombregpo']
handler.category = 'Admin'

handler.exec = async (sock, m, args) => {
 let jid = m.key.remoteJid
 if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: `《✧》 Solo en grupos.` }, { quoted: m })

 let metadata = await sock.groupMetadata(jid)
 let senderIds = [m.key.participant, m.key.participantAlt, m.participant, m.sender].filter(Boolean)
 let senderP = metadata.participants.find(p => senderIds.includes(p.id) || senderIds.includes(p.lid) || senderIds.includes(p.phoneNumber))
 let isSenderAdmin = senderP && (senderP.admin === 'admin' || senderP.admin === 'superadmin')
 if (!isSenderAdmin) return sock.sendMessage(jid, { text: `《✧》 No eres admin.` }, { quoted: m })

 let name = args.join(' ').trim()
 if (!name) return sock.sendMessage(jid, { text: `《✧》 Uso: .setgruponame Nuevo Nombre` }, { quoted: m })
 if (name.length > 25) return sock.sendMessage(jid, { text: `《✧》 El nombre no puede tener más de 25 caracteres.` }, { quoted: m })

 try {
 await sock.groupUpdateSubject(jid, name)
 await sock.sendMessage(jid, { text: `✐ Nombre del grupo cambiado a: *${name}*` }, { quoted: m })
 } catch(e){
 await sock.sendMessage(jid, { text: `❌ No pude cambiar el nombre: ${e.message}\n¿El bot es admin?` }, { quoted: m })
 }
}
export default handler
