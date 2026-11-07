import { getGifRandom } from '../../lib/gifs.js'
export const handler = {}
handler.name = 'pat'
handler.alias = ['acariciar', 'palmadita']
handler.category = 'reacciones'
handler.exec = async (sock, m) => {
 let jid = m.key.remoteJid
 let target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.message?.extendedTextMessage?.contextInfo?.participant
 let sender = m.key.participant || m.key.remoteJid
 let pick = a => a[Math.floor(Math.random()*a.length)]
 let con = [`@${sender.split('@')[0]} le acaricia la cabeza a @${target?.split('@')[0]} 🥺`, `@${sender.split('@')[0]} le da una palmadita a @${target?.split('@')[0]} ✨`, `@${sender.split('@')[0]} acaricia a @${target?.split('@')[0]} como un gatito 🐱`, `@${sender.split('@')[0]} le hace pat pat a @${target?.split('@')[0]} 🤍`]
 let solo = [`@${sender.split('@')[0]} se acaricia a si mismo 🥺`, `@${sender.split('@')[0]} se da pat pat solito ✨`]
 let texto = target ? pick(con) : pick(solo)
 let gif = getGifRandom('pat', jid) || getGifRandom('acariciar', jid)
 if(!gif) return sock.sendMessage(jid, { text: `${texto}\n\n⚠️ No hay gifs, un staff tiene que hacer .addgif pat` }, { quoted: m })
 await sock.sendMessage(jid, { video: gif.buffer, mimetype: 'video/mp4', fileName: 'pat.mp4', gifPlayback: true, caption: texto, mentions: target ? [sender, target] : [sender] }, { quoted: m })
}
export default handler
