import { loadMods, saveMods, isMod, getRango, getNextRango, cleanNum } from '../../lib/mods.js'

export const handler = {}
handler.name = 'addestrella'
handler.alias = ['addstar', 'darestrella']
handler.category = 'mod'

handler.exec = async (sock, m, a) => {
 const chatId = m.key.remoteJid
 if (!isMod(m)) return sock.sendMessage(chatId, { text: '⚠️ Solo staff / owner' }, { quoted: m })

 let args = a.map(x => x.replace(/[^0-9]/g, '')).filter(Boolean)

 let mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]?.replace(/[^0-9]/g, '')
 let replied = m.message?.extendedTextMessage?.contextInfo?.participant?.replace(/[^0-9]/g, '')

 let cantidad = null
 let target = null

 if (args.length >= 2) {
 if (args[0].length >= 7 && args[1].length < 7) {
 target = args[0]
 cantidad = parseInt(args[1])
 } else {
 cantidad = parseInt(args[0])
 target = args[1]
 }
 } else if (args.length === 1) {
 cantidad = parseInt(args[0])
 target = mentioned || replied
 } else {
 target = mentioned || replied
 }

 if (target) target = cleanNum ? cleanNum(target) : target

 if (!target || isNaN(cantidad) || cantidad <= 0) {
 return sock.sendMessage(chatId, { text: '✳️ Uso: .addestrella 10 5492645746772\nO respondé al mensaje de la persona: .addestrella 10' }, { quoted: m })
 }

 let db = loadMods()
 if (!db[target]) db[target] = { rol: 'staff', stars: 0 }

 let antes = getRango(db[target].stars)
 db[target].stars += cantidad
 let ahora = getRango(db[target].stars)
 let next = getNextRango(db[target].stars)
 saveMods(db)

 let subio = antes.nombre !== ahora.nombre ? `\n\n🎉 ¡SUBIÓ DE RANGO!\n${antes.nombre} ➜ ${ahora.nombre}` : ''
 let falta = next ? `\n📈 Falta ${next.min - db[target].stars}⭐ para ${next.nombre}` : `\n🏆 Rango máximo`

 await sock.sendMessage(chatId, { text: `⭐ Estrellas agregadas\n\n👤 @${target}\n➕ +${cantidad}⭐\n💰 Total: ${db[target].stars}⭐\n🛡️ Rango: ${ahora.nombre}${subio}${falta}`, mentions: [target + '@s.whatsapp.net'] }, { quoted: m })
}
export default handler
