import { getGifRandom } from '../../lib/gifs.js'
export const handler = {}
handler.name = 'kiss'
handler.alias = ['beso', 'besar']
handler.category = 'reacciones'
handler.exec = async (sock, m) => {
 let jid = m.key.remoteJid
 let target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.message?.extendedTextMessage?.contextInfo?.participant
 let sender = m.key.participant || m.key.remoteJid
 let pick = a => a[Math.floor(Math.random()*a.length)]
 let con = [`@${sender.split('@')[0]} le dio un beso a @${target?.split('@')[0]} 😘`, `@${sender.split('@')[0]} besó a @${target?.split('@')[0]} con amor 💋`, `@${sender.split('@')[0]} le plantó un beso a @${target?.split('@')[0]} 😚`, `@${sender.split('@')[0]} le dio un besito a @${target?.split('@')[0]} 🥺💋`]
 let solo = [`@${sender.split('@')[0]} se da un beso a si mismo 😘`, `@${sender.split('@')[0]} manda un beso al aire 💋`]
 let texto = target ? pick(con) : pick(solo)
 let gif = getGifRandom('kiss', jid) || getGifRandom('beso', jid) || getGifRandom('besar', jid)
 if(!gif) return sock.sendMessage(jid, { text: `${texto}\n\n⚠️ No hay gifs, un staff tiene que hacer .addgif kiss` }, { quoted: m })
 await sock.sendMessage(jid, { video: gif.buffer, mimetype: 'video/mp4', fileName: 'kiss.mp4', gifPlayback: true, caption: texto, mentions: target ? [sender, target] : [sender] }, { quoted: m })
}
export default handler
