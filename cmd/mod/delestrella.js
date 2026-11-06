import { loadMods, saveMods, isMod, getRango } from '../../lib/mods.js'
export const handler = {}
handler.name = 'delestrella'
handler.alias = ['delstar', 'quitarestrella']
handler.category = 'mod'
handler.exec = async (sock, m, a) => {
 const chatId = m.key.remoteJid
 if(!isMod(m)) return sock.sendMessage(chatId, { text: '⚠️ Solo staff / owner' }, { quoted: m })
 let nums = a.filter(x=>/^\d+$/.test(x))
 let cantidad = parseInt(nums[0])
 let target = nums.length >= 2 ? nums[1] : null
 if(!target || isNaN(cantidad)) return sock.sendMessage(chatId, { text: '✳️ Uso: .delestrella 5 5492645746772' }, { quoted: m })
 let db = loadMods()
 if(!db[target]) return sock.sendMessage(chatId, { text: '❌ Esa persona no tiene estrellas' }, { quoted: m })
 db[target].stars = Math.max(0, db[target].stars - cantidad)
 saveMods(db)
 await sock.sendMessage(chatId, { text: `⭐ Estrellas quitadas\n\n👤 @${target}\n➖ -${cantidad}⭐\n💰 Total: ${db[target].stars}⭐\n🛡️ Rango: ${getRango(db[target].stars).nombre}`, mentions: [target+'@s.whatsapp.net'] }, { quoted: m })
}
export default handler
