import config from '../../config.js'

export const handler = {}
handler.name = 'wshop'
handler.alias = ['haremshop','tiendawaifus']
handler.category = 'gacha'
handler.description = 'Ver personajes en venta'

handler.exec = async (sock,m,args,extra)=>{
 const chatId = m.key.remoteJid
 const usedPrefix = extra?.usedPrefix || '.'
 let db = global.db?.data || {}
 if (!db.chats) db.chats={}
 if (!db.chats[chatId]) db.chats[chatId]={}
 if (!db.chats[chatId].sales) db.chats[chatId].sales={}
 let chat = db.chats[chatId]

 const ahora = Date.now()
 let cambios=false
 for (const [id,venta] of Object.entries(chat.sales||{})){
 if (ahora - venta.time >= 3*864e5){ delete chat.sales[id]; cambios=true }
 }
 if (cambios){ extra?.saveDB?.(); global.saveDB?.() }

 const ventas = Object.entries(chat.sales||{})
 if (!ventas.length) return sock.sendMessage(chatId,{text:`ꕥ No hay personajes en venta en este grupo`},{quoted:m})

 const page = parseInt((args.args||args)[0])||1
 const porPagina=10
 const totalPaginas=Math.ceil(ventas.length/porPagina)
 if (page<1||page>totalPaginas) return sock.sendMessage(chatId,{text:`ꕥ Página inválida. Solo hay *${totalPaginas}*`},{quoted:m})

 const currency = config.economy?.coin || 'Coins'
 const listado=[]
 for (const [id,venta] of ventas.slice((page-1)*porPagina, page*porPagina)){
 const precios = typeof venta.price==='number'? `¥${venta.price.toLocaleString()} ${currency}` : 'Precio no disponible'
 const tiempoRestante = 3*864e5 - (Date.now()-venta.time)
 const d=Math.floor(tiempoRestante/86400000); const h=Math.floor(tiempoRestante%86400000/3600000); const m_=Math.floor(tiempoRestante%3600000/60000); const s=Math.floor(tiempoRestante%60000/1000)
 const vendedor = db.users?.[venta.user]?.name || db.chat_users?.[chatId]?.[venta.user]?.name || venta.user.split('@')[0]
 const character = db.characters?.[id] || db.characters?.[chatId+'__'+id]
 const valorFinal = character?.value || 0
 listado.push(`❀ *${venta.name}* (✰ ${valorFinal.toLocaleString()}):\n⛁ Precio » *${precios}*\n❖ Vendedor » *${vendedor}*\nⴵ Expira en » *${d}d ${h}h ${m_}m ${s}s*`)
 }
 await sock.sendMessage(chatId,{text:`*☆ HaremShop*\n❏ Personajes en venta <${ventas.length}>:\n\n`+listado.join('\n\n')+`\n\n> • Página *${page}* de *${totalPaginas}*`},{quoted:m})
}
