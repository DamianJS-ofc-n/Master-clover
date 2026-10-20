export const handler = {}
handler.name = 'setclaim'
handler.alias = ['setclaimmsg']
handler.category = 'gacha'

handler.exec = async (sock, m) => {
 let jid=m.key.remoteJid
 let body=(m.message?.conversation || m.message?.extendedTextMessage?.text || '').trim()
 let args=body.split(' ').slice(1)
 let usedPrefix=body[0]||'.'
 try{
 let db = global.db || (await import('../lib/db.js').then(r=>r.default||r).catch(()=>null))
 if (!db) return sock.sendMessage(jid, { text:`No se encontró db` }, { quoted: m })
 const chat = db.getChat? db.getChat(jid) : { adminonly:false, gacha:true }
 if (chat.adminonly ||!chat.gacha) return sock.sendMessage(jid, { text:`ꕥ Gacha desactivado. Activa con ${usedPrefix}gacha on` }, { quoted: m })
 if (!args[0]) return sock.sendMessage(jid, { text:`❀ Uso: ${usedPrefix}setclaim €user ha reclamado €character` }, { quoted: m })
 const customMsg=args.join(' ')
 if (!customMsg.includes('€user') ||!customMsg.includes('€character')) return sock.sendMessage(jid, { text:`Debe incluir €user y €character` }, { quoted: m })
 if (db.setUser) db.setUser(m.key.participant||jid, 'claimMessage', customMsg)
 if (global.db?.data?.users) { let u = global.db.data.users[m.sender||m.key.participant||jid]; if(u) u.claimMessage=customMsg }
 await sock.sendMessage(jid, { text:`❀ Mensaje modificado.` }, { quoted: m })
 }catch(e){ await sock.sendMessage(jid, { text:`Error: ${e.message}` }, { quoted: m }) }
}
