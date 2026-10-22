export const handler = {}
handler.name = 'album'
handler.alias = ['coleccion', 'misfiguritas']
handler.category = 'album'
function norm(id){ return id?.split('@')[0].replace(/\D/g,'').slice(-10) }
function getUserKey(chatId, userId){
 let db = global.db?.data || {}
 let users = db.chat_users?.[chatId] || {}
 if(users[userId]) return userId
 let target = norm(userId)
 for(let uid in users){ if(norm(uid)===target) return uid }
 return userId
}
handler.exec = async (sock, m, args) => {
 const chatId = m.key.remoteJid
 let targetId = m.key.participant || m.key.remoteJid
 if(m.mentionedJid?.[0]) targetId = m.mentionedJid[0]
 const realKey = getUserKey(chatId, targetId)
 let db = global.db?.data || {}
 let user = db.chat_users?.[chatId]?.[realKey]
 if(!user?.mundial?.length) return sock.sendMessage(chatId, {text:`📭 Sin cartas, usa .mr`}, {quoted:m})
 let coleccion = user.mundial
 let totalValor = coleccion.reduce((a,b)=>a+(b.valor||0),0)
 let txt = `*📘 ÁLBUM MUNDIAL 2026*\n🃏 Cartas: ${coleccion.length}\n💰 Valor: ${totalValor.toLocaleString()}\n━━━━━━━━━━━━━━━\n`
 coleccion.slice(-20).reverse().forEach((c,i)=>{ txt += `${i+1}. ${c.nombre} - ${c.pais} [${c.rareza}]\n` })
 await sock.sendMessage(chatId, {text: txt}, {quoted:m})
}
