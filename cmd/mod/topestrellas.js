import { loadMods, getRango, cleanNum } from '../../lib/mods.js'
export const handler = {}
handler.name = 'topestrellas'
handler.alias = ['topstars', 'top']
handler.category = 'mod'
handler.exec = async (sock, m, a) => {
 const chatId = m.key.remoteJid
 let db = loadMods()
 let list = Object.entries(db).sort((a,b)=> (b[1].stars||0)-(a[1].stars||0)).slice(0,10)
 if(!list.length) return sock.sendMessage(chatId, { text: '❌ Nadie tiene estrellas todavía' }, { quoted: m })
 let texto = `· · ──────── ·· ──────── · ·\n├┈ ✦ TOP ESTRELLAS ✦\n╰─────── ✦・⭐・✦ ───────\n\n` + list.map(([num, u], i) => {
 let medalla = i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}.`
 return `${medalla} @${num} » ${u.stars}⭐ » ${getRango(u.stars).nombre}`
 }).join('\n') + `\n╰─────✦・🚀・✦─────`
 let mentions = list.map(([num]) => num+'@s.whatsapp.net')
 await sock.sendMessage(chatId, { text: texto, mentions }, { quoted: m })
}
export default handler
