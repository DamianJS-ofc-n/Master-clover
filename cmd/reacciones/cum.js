import { getGifRandom } from '../../lib/gifs.js'
export const handler = {}
handler.name = 'cum'
handler.alias = ['cumear', 'cumm']
handler.category = 'reacciones'

handler.exec = async (sock, m) => {
 let from = m.key.remoteJid
 if (!global.db.data.chats) global.db.data.chats = {}
 if (!global.db.data.chats[from]) global.db.data.chats[from] = {}
 let chat = global.db.data.chats[from]

 if (chat.nsfw !== true) return sock.sendMessage(from, { text: `🔞 NSFW desactivado.\n*.nsfw enable*\n\n[debug] nsfw actual: ${chat.nsfw}` }, { quoted: m })

 let target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.message?.extendedTextMessage?.contextInfo?.participant
 let sender = m.key.participant || m.key.remoteJid
 let pick = a => a[Math.floor(Math.random()*a.length)]
 let caras = ['(⁠╥⁠﹏⁠╥⁠)', '(⁠;⁠ŏ⁠﹏⁠ŏ⁠)', '(⁠っ⁠˘̩⁠╭⁠╮⁠˘̩⁠)⁠っ', '｡⁠:ﾟ⁠(⁠;⁠´⁠∩⁠`⁠;⁠)ﾟ⁠:⁠｡']
 let cara = pick(caras)
 let texto = target
 ? pick([`@${sender.split('@')[0]} se vino dentro de @${target.split('@')[0]} ${cara}`, `@${sender.split('@')[0]} se está follando a @${target.split('@')[0]} ${cara}`])
 : pick([`@${sender.split('@')[0]} está llorando ${cara}`, `@${sender.split('@')[0]} es con ganas ${cara}`])

 let gif = getGifRandom('cum', from) || getGifRandom('cumear', from)
 if(!gif) return sock.sendMessage(from, { text: `${texto}\n\n⚠️ No hay gifs, un staff tiene que hacer .addgif cum` }, { quoted: m })
 await sock.sendMessage(from, { video: gif.buffer, mimetype: 'video/mp4', fileName: 'cum.mp4', gifPlayback: true, caption: texto, mentions: target ? [sender, target] : [sender] }, { quoted: m })
}
export default handler
