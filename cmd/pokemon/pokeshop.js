import config from '../../config.js'

export const handler = {}
handler.name = 'pokeshop'
handler.alias = ['pshop','tiendapoke']
handler.category = 'pokemon'
handler.description = 'Ver pokemons en venta del grupo'

handler.exec = async (sock,m,args,extra)=>{
 const chatId = m.key.remoteJid
 let db = global.db?.data || {}
 if (!db.chats) db.chats={}
 if (!db.chats[chatId]) db.chats[chatId]={}
 if (!db.chats[chatId].pokeSales) db.chats[chatId].pokeSales={}
 let chat = db.chats[chatId]

 // limpiar expirados 3 días
 const ahora = Date.now()
 for (const [k,v] of Object.entries(chat.pokeSales)) if (ahora - v.time >= 3*864e5) delete chat.pokeSales[k]

 const ventas = Object.entries(chat.pokeSales||{})
 if (!ventas.length) return sock.sendMessage(chatId,{text:`ꕥ No hay pokémons en venta en este grupo`},{quoted:m})

 const coin = config.economy?.symbol || '⛃'
 const page = parseInt(args[0])||1
 const perPage=10
 const total=Math.ceil(ventas.length/perPage)
 if (page<1||page>total) return sock.sendMessage(chatId,{text:`Página inválida, hay ${total}`},{quoted:m})

 let txt = `*☆ PokeShop del Grupo*\n❏ En venta <${ventas.length}>:\n\n`
 for (const [saleId, v] of ventas.slice((page-1)*perPage, page*perPage)){
 const p = db.pokeChars?.[v.charKey] || { name: v.name, value: 0 }
 const exp = 3*864e5 - (Date.now()-v.time)
 const d=Math.floor(exp/86400000), h=Math.floor(exp%86400000/3600000)
 txt+=`❀ *${v.name}* #${v.pokeId} (✰ ${p.value.toLocaleString()})\n⛁ Precio » *${coin}${v.price.toLocaleString()}*\n❖ Vendedor » @${v.user.split('@')[0]}\nⴵ Expira » *${d}d ${h}h* - ID: *${saleId}*\n\n`
 }
 txt+=`> Página *${page}* de *${total}* - Compra con *.pokebuy ${ventas[0][0]}*`
 await sock.sendMessage(chatId,{text:txt, mentions: ventas.slice((page-1)*perPage, page*perPage).map(([,v])=>v.user)},{quoted:m})
}
