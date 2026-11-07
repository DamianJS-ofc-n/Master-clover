import { getGifRandom } from '../../lib/gifs.js'
export const handler = {}
handler.name = 'sleep'
handler.alias = ['dormir', 'durmiendo', 'mimir']
handler.category = 'reacciones'
handler.exec = async (sock, m) => {
 let jid = m.key.remoteJid
 let target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.message?.extendedTextMessage?.contextInfo?.participant
 let sender = m.key.participant || m.key.remoteJid
 let pick = a => a[Math.floor(Math.random()*a.length)]
 let caras = ['ฅ⁠^⁠•⁠ﻌ⁠•⁠^⁠ฅ', '(⁠=⁠^⁠･⁠ｪ⁠･⁠^⁠=⁠)', 'ʕ⁠´⁠•⁠ᴥ⁠•̥⁠`⁠ʔ', '⊙⁠﹏⁠⊙']
 let cara = pick(caras)
 let con = [
 `@${sender.split('@')[0]} se va a dormir con @${target?.split('@')[0]} ${cara}`,
 `@${sender.split('@')[0]} se duerme abrazado a @${target?.split('@')[0]} ${cara}`,
 `@${sender.split('@')[0]} le da sueño y se duerme al lado de @${target?.split('@')[0]} ${cara}`
 ]
 let solo = [
 `@${sender.split('@')[0]} se va a dormir ${cara}`,
 `@${sender.split('@')[0]} tiene sueño y se duerme ${cara}`,
 `@${sender.split('@')[0]} se va a mimir ${cara}`
 ]
 let texto = target ? pick(con) : pick(solo)
 let gif = getGifRandom('sleep', jid) || getGifRandom('dormir', jid) || getGifRandom('mimir', jid)
 if(!gif) return sock.sendMessage(jid, { text: `${texto}\n\n⚠️ No hay gifs, un staff tiene que hacer .addgif sleep` }, { quoted: m })
 await sock.sendMessage(jid, { video: gif.buffer, mimetype: 'video/mp4', fileName: 'sleep.mp4', gifPlayback: true, caption: texto, mentions: target ? [sender, target] : [sender] }, { quoted: m })
}
export default handler
