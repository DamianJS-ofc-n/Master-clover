import { loadMods, getRango, getNextRango, getNumeroManual, cleanNum } from '../../lib/mods.js'
export const handler = {}
handler.name = 'estrellas'
handler.alias = ['stars', 'misestrellas']
handler.category = 'mod'
handler.exec = async (sock, m, a) => {
 const chatId = m.key.remoteJid
 let target = getNumeroManual(a)
 if(!target){
 let me = (m.key?.participant || m.key?.remoteJid).split('@')[0].replace(/\D/g,'')
 target = me
 }
 let db = loadMods()
 let user = db[target]
 if(!user) return sock.sendMessage(chatId, { text: `❌ @${target} no es staff / no tiene estrellas`, mentions: [target+'@s.whatsapp.net'] }, { quoted: m })
 let rango = getRango(user.stars)
 let next = getNextRango(user.stars)
 let falta = next ? `\n📈 Falta ${next.min - user.stars}⭐ para ${next.nombre}` : `\n🏆 Rango máximo`
 await sock.sendMessage(chatId, { text: `· · ──────── ·· ──────── · ·\n├┈ ✦ ESTRELLAS ✦\n├• ✐; @${target}\n╰─────── ✦・⭐・✦ ───────\n\n⭐ 𝙀𝙨𝙩𝙧𝙚𝙡𝙡𝙖𝙨:\n├• ✐; ${user.stars}⭐\n\n🛡️ 𝙍𝙖𝙣𝙜𝙤:\n├• ✐; ${rango.nombre}${falta}\n╰─────✦・🚀・✦─────`, mentions: [target+'@s.whatsapp.net'] }, { quoted: m })
}
export default handler
