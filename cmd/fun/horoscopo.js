export const handler = {}
handler.name = 'horoscopo'
handler.alias = ['horoscope','zodiaco']
handler.category = 'fun'
handler.exec = async (sock,m,args)=>{
 const signos = { aries:'Hoy conquistarás a alguien', tauro:'Dinero inesperado', geminis:'No confíes en todos', cancer:'Amor a la vista', leo:'Brillarás', virgo:'Ordena tu vida', libra:'Toma una decisión', escorpio:'Venganza dulce', sagitario:'Viaje corto', capricornio:'Trabajo duro', acuario:'Idea brillante', piscis:'Llora pero luego ríe' }
 let s = (args[0]||'').toLowerCase()
 if(!signos[s]) return sock.sendMessage(m.key.remoteJid, { text: `🔮 Uso: .horoscopo aries/tauro/geminis/cancer/leo/virgo/libra/escorpio/sagitario/capricornio/acuario/piscis` }, { quoted: m })
 return sock.sendMessage(m.key.remoteJid, { text: `🔮 *Horóscopo ${s.toUpperCase()}*\n\n${signos[s]}\n\nSuerte: ${Math.floor(Math.random()*100)}%` }, { quoted: m })
}
