import { loadMods, getRango, getNextRango, getNumeroManual, RANGOS } from '../../lib/mods.js'
export const handler = {}
handler.name = 'rango'
handler.alias = ['rank', 'mirango']
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
 if(!user) return sock.sendMessage(chatId, { text: `❌ @${target} no es staff`, mentions: [target+'@s.whatsapp.net'] }, { quoted: m })
 let rango = getRango(user.stars)
 let next = getNextRango(user.stars)
 let lista = RANGOS.map(r=>`${user.stars >= r.min ? '✅' : '🔒'} ${r.nombre} » ${r.min}⭐`).join('\n')
 let falta = next ? `📈 Te falta ${next.min - user.stars}⭐ para ${next.nombre}` : `🏆 Ya sos rango máximo`
 await sock.sendMessage(chatId, { text: `· · ──────── ·· ──────── · ·\n├┈ ✦ RANGO ✦\n├• ✐; @${target}\n╰─────── ✦・🛡️・✦ ───────\n\n🛡️ 𝙍𝙖𝙣𝙜𝙤 𝘼𝙘𝙩𝙪𝙖𝙡:\n├• ✐; ${rango.nombre}\n├• ✐; ${user.stars}⭐\n\n${falta}\n\n├┈ ✦ 𝙏𝙊𝘿𝙊𝙎 𝙇𝙊𝙎 𝙍𝘼𝙉𝙂𝙊𝙎 ✦\n${lista}\n╰─────✦・🚀・✦─────`, mentions: [target+'@s.whatsapp.net'] }, { quoted: m })
}
export default handler
