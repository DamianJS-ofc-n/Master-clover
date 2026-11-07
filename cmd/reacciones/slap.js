import { getGifRandom } from '../../lib/gifs.js'
export const handler = {}
handler.name = 'slap'
handler.alias = ['cachetada', 'bofetada']
handler.category = 'reacciones'

handler.exec = async (sock, m) => {
 let from = m.key.remoteJid
 let target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.message?.extendedTextMessage?.contextInfo?.participant
 let sender = m.key.participant || m.key.remoteJid
 let pick = a => a[Math.floor(Math.random()*a.length)]
 let caras = ['(╬☉д⊙)', '(¬_¬)', '(>_<)', '(｀Д´)']
 let cara = pick(caras)
 let texto = target
 ? pick([`@${sender.split('@')[0]} le metio una cachetada a @${target.split('@')[0]} ${cara}`, `@${sender.split('@')[0]} abofeteo a @${target.split('@')[0]} por pesado ${cara}`, `@${sender.split('@')[0]} le dio un slap a @${target.split('@')[0]} ${cara}`])
 : `@${sender.split('@')[0]} se dio una cachetada a si mismo ${cara}`
 let gif = getGifRandom('slap', from)
 if(!gif) return sock.sendMessage(from, { text: `${texto}\n\nNo hay gifs, un staff tiene que hacer .addgif slap` }, { quoted: m })
 await sock.sendMessage(from, { video: gif.buffer, mimetype: 'video/mp4', fileName: 'slap.mp4', gifPlayback: true, caption: texto, mentions: target ? [sender, target] : [sender] }, { quoted: m })
}
export default handler
