import { getGifRandom } from '../../lib/gifs.js'
export const handler = {}
handler.name = 'highfive'
handler.alias = ['chocala']
handler.category = 'reacciones'

handler.exec = async (sock, m) => {
 let from = m.key.remoteJid
 let target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.message?.extendedTextMessage?.contextInfo?.participant
 let sender = m.key.participant || m.key.remoteJid
 let pick = a => a[Math.floor(Math.random()*a.length)]
 let caras = ['(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧', '(＾▽＾)', '(≧▽≦)', '(☆▽☆)']
 let cara = pick(caras)
 let texto = target
 ? `@${sender.split('@')[0]} choco los cinco con @${target.split('@')[0]} ${cara}`
 : `@${sender.split('@')[0]} dio un highfive al aire ${cara}`
 let gif = getGifRandom('highfive', from)
 if(!gif) return sock.sendMessage(from, { text: `${texto}\n\nNo hay gifs, un staff tiene que hacer .addgif highfive` }, { quoted: m })
 await sock.sendMessage(from, { video: gif.buffer, mimetype: 'video/mp4', fileName: 'highfive.mp4', gifPlayback: true, caption: texto, mentions: target ? [sender, target] : [sender] }, { quoted: m })
}
export default handler
