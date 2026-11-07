import { getGifRandom } from '../../lib/gifs.js'
export const handler = {}
handler.name = 'blush'
handler.category = 'reacciones'

handler.exec = async (sock, m) => {
 let from = m.key.remoteJid
 let target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.message?.extendedTextMessage?.contextInfo?.participant
 let sender = m.key.participant || m.key.remoteJid
 let pick = a => a[Math.floor(Math.random()*a.length)]
 let caras = ['(⁄ ⁄>⁄ ▽ ⁄<⁄)', '(⁄⁄•⁄ω⁄•⁄⁄)', '(⁄⁄>⁄ω⁄<⁄⁄)', '(///ω///)']
 let cara = pick(caras)
 let texto = target
 ? `@${sender.split('@')[0]} se sonrojo por @${target.split('@')[0]} ${cara}`
 : `@${sender.split('@')[0]} se sonrojo ${cara}`
 let gif = getGifRandom('blush', from)
 if(!gif) return sock.sendMessage(from, { text: `${texto}\n\nNo hay gifs, un staff tiene que hacer .addgif blush` }, { quoted: m })
 await sock.sendMessage(from, { video: gif.buffer, mimetype: 'video/mp4', fileName: 'blush.mp4', gifPlayback: true, caption: texto, mentions: target ? [sender, target] : [sender] }, { quoted: m })
}
export default handler
