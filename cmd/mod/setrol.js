import { loadMods, saveMods, isOwner, getNumeroManual } from '../../lib/mods.js'
export const handler = {}
handler.name = 'setrol'
handler.alias = ['setrole', 'darstaff', 'addstaff']
handler.category = 'mod'
handler.owner = true
handler.exec = async (sock, m, a) => {
 const chatId = m.key.remoteJid
 if(!isOwner(m)) return sock.sendMessage(chatId, { text: '⚠️ Solo owners' }, { quoted: m })
 let rol = (a[0]||'').toLowerCase()
 let target = getNumeroManual(a)
 if(rol !== 'staff' || !target) return sock.sendMessage(chatId, { text: '✳️ Uso: .setrol staff 5492645746772' }, { quoted: m })
 let db = loadMods()
 if(db[target]?.rol === 'staff') return sock.sendMessage(chatId, { text: `⚠️ @${target} ya es staff` }, { quoted: m })
 db[target] = { rol: 'staff', stars: db[target]?.stars || 0, fecha: new Date().toLocaleDateString('es-ES') }
 saveMods(db)
 await sock.sendMessage(chatId, { text: `✅ Staff agregado\n\n👤 @${target}\n🛡️ Rango: 🛡️ 𝙋𝙍𝙄𝙉𝘾𝙄𝙋𝙄𝘼𝙉𝙏𝙀\n⭐ Estrellas: ${db[target].stars}`, mentions: [target+'@s.whatsapp.net'] }, { quoted: m })
}
export default handler
