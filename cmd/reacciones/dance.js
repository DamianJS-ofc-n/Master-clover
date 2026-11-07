import { getGifRandom } from '../../lib/gifs.js'
export const handler = {}
handler.name = 'dance'
handler.alias = ['bailar', 'baile']
handler.category = 'reacciones'
handler.exec = async (sock, m) => {
 let jid = m.key.remoteJid
 let target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.message?.extendedTextMessage?.contextInfo?.participant
 let sender = m.key.participant || m.key.remoteJid
 let pick = a => a[Math.floor(Math.random()*a.length)]
 let con = [`@${sender.split('@')[0]} se pone a bailar con @${target?.split('@')[0]} 💃🕺`, `@${sender.split('@')[0]} invita a @${target?.split('@')[0]} a bailar 🎶`, `@${sender.split('@')[0]} y @${target?.split('@')[0]} se ponen a bailar juntos 🔥`]
 let solo = [`@${sender.split('@')[0]} se pone a bailar solo 💃`, `@${sender.split('@')[0]} baila como nadie lo ve 🕺`, `@${sender.split('@')[0]} se manda unos pasitos 🎶`]
 let texto = target ? pick(con) : pick(solo)
 let gif = getGifRandom('dance', jid) || getGifRandom('bailar', jid) || getGifRandom('baile', jid)
 if(!gif) return sock.sendMessage(jid, { text: `${texto}\n\n⚠️ No hay gifs, un staff tiene que hacer .addgif dance` }, { quoted: m })
 await sock.sendMessage(jid, { video: gif.buffer, mimetype: 'video/mp4', fileName: 'dance.mp4', gifPlayback: true, caption: texto, mentions: target ? [sender, target] : [sender] }, { quoted: m })
}
export default handler
