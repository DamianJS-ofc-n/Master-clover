import { loadMods, saveMods, isOwner, getNumeroManual, getTarget, cleanNum } from '../../lib/mods.js'
export const handler = {}
handler.name = 'delrol'
handler.alias = ['delrole', 'quitarstaff', 'delstaff']
handler.category = 'mod'
handler.owner = true
handler.exec = async (sock, m, a) => {
 const chatId = m.key.remoteJid
 if(!isOwner(m)) return sock.sendMessage(chatId, { text: '⚠️ Solo owners' }, { quoted: m })
 let target = getNumeroManual(a)
 if(!target){
 let t = await getTarget(m, sock, a)
 target = cleanNum(t)
 }
 if(!target) return sock.sendMessage(chatId, { text: '✳️ Uso: .delrol 5492645746772 o responde / menciona' }, { quoted: m })
 let db = loadMods()
 if(!db[target]) return sock.sendMessage(chatId, { text: `❌ @${target} no es staff` }, { quoted: m })
 delete db[target]
 saveMods(db)
 await sock.sendMessage(chatId, { text: `✅ Staff eliminado\n\n👤 @${target}`, mentions: [target+'@s.whatsapp.net'] }, { quoted: m })
}
export default handler
