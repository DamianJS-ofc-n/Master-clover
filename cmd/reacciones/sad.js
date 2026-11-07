import { getGifRandom } from '../../lib/gifs.js'
export const handler = {}
handler.name = 'sad'
handler.alias = ['triste', 'llorar']
handler.category = 'reacciones'
handler.exec = async (sock, m) => {
 let jid = m.key.remoteJid
 let target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.message?.extendedTextMessage?.contextInfo?.participant
 let sender = m.key.participant || m.key.remoteJid
 let pick = a => a[Math.floor(Math.random()*a.length)]
 let con = [`@${sender.split('@')[0]} se pone triste por culpa de @${target?.split('@')[0]} 😢`, `@${sender.split('@')[0]} llora por @${target?.split('@')[0]} 🥺`, `@${sender.split('@')[0]} está triste, @${target?.split('@')[0]} abrazalo 😭`]
 let solo = [`@${sender.split('@')[0]} está triste 😢`, `@${sender.split('@')[0]} se puso a llorar 🥺`, `@${sender.split('@')[0]} está en modo sad 😭`]
 let texto = target ? pick(con) : pick(solo)
 let gif = getGifRandom('sad', jid) || getGifRandom('triste', jid)
 if(!gif) return sock.sendMessage(jid, { text: `${texto}\n\n⚠️ No hay gifs, un staff tiene que hacer .addgif sad` }, { quoted: m })
 await sock.sendMessage(jid, { video: gif.buffer, mimetype: 'video/mp4', fileName: 'sad.mp4', gifPlayback: true, caption: texto, mentions: target ? [sender, target] : [sender] }, { quoted: m })
}
export default handler
