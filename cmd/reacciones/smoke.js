import { getGifRandom } from '../../lib/gifs.js'
export const handler = {}
handler.name = 'smoke'
handler.alias = ['fumar', 'fumando']
handler.category = 'reacciones'
handler.exec = async (sock, m) => {
 let jid = m.key.remoteJid
 let target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.message?.extendedTextMessage?.contextInfo?.participant
 let sender = m.key.participant || m.key.remoteJid
 let pick = a => a[Math.floor(Math.random()*a.length)]
 let con = [`@${sender.split('@')[0]} se pone a fumar con @${target?.split('@')[0]} 🚬`, `@${sender.split('@')[0]} le ofrece un cigarro a @${target?.split('@')[0]} 🚬`, `@${sender.split('@')[0]} fuma tranquilo al lado de @${target?.split('@')[0]} 😮‍💨`]
 let solo = [`@${sender.split('@')[0]} se prende un cigarro 🚬`, `@${sender.split('@')[0]} fuma tranquilo 😮‍💨`, `@${sender.split('@')[0]} está en modo fumador 🚬`]
 let texto = target ? pick(con) : pick(solo)
 let gif = getGifRandom('smoke', jid) || getGifRandom('fumar', jid)
 if(!gif) return sock.sendMessage(jid, { text: `${texto}\n\n⚠️ No hay gifs, un staff tiene que hacer .addgif smoke` }, { quoted: m })
 await sock.sendMessage(jid, { video: gif.buffer, mimetype: 'video/mp4', fileName: 'smoke.mp4', gifPlayback: true, caption: texto, mentions: target ? [sender, target] : [sender] }, { quoted: m })
}
export default handler
