export const handler = {}
handler.name = 'azar'
handler.alias = ['random','sorteo2']
handler.category = 'fun'
handler.exec = async (sock,m,args)=>{
 let max = parseInt(args[0])||100
 let n = Math.floor(Math.random()*max)+1
 return sock.sendMessage(m.key.remoteJid, { text: `🎲 Número al azar entre 1 y ${max}: *${n}*` }, { quoted: m })
}
