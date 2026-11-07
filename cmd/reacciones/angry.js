import { getGifRandom } from '../../lib/gifs.js'
export const handler = {}
handler.name = 'angry'
handler.alias = ['enojado', 'enojo', 'molesto']
handler.category = 'reacciones'
handler.exec = async (sock, m) => {
 let jid = m.key.remoteJid
 let target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.message?.extendedTextMessage?.contextInfo?.participant
 let sender = m.key.participant || m.key.remoteJid
 let pick = a => a[Math.floor(Math.random()*a.length)]
 let caras = ['ฅ⁠^⁠•⁠ﻌ⁠•⁠^⁠ฅ', '(⁠=⁠^⁠･⁠ｪ⁠･⁠^⁠=⁠)', 'ʕ⁠´⁠•⁠ᴥ⁠•̥⁠`⁠ʔ', '⊙⁠﹏⁠⊙']
 let cara = pick(caras)
 let con = [
 `@${sender.split('@')[0]} se enojó con @${target?.split('@')[0]} ${cara}`,
 `@${sender.split('@')[0]} está furioso con @${target?.split('@')[0]} ${cara}`,
 `@${sender.split('@')[0]} mira feo a @${target?.split('@')[0]} ${cara}`,
 `@${sender.split('@')[0]} se molesta con @${target?.split('@')[0]} ${cara}`
 ]
 let solo = [
 `@${sender.split('@')[0]} está enojado ${cara}`,
 `@${sender.split('@')[0]} está furioso ${cara}`,
 `@${sender.split('@')[0]} está que explota ${cara}`
 ]
 let texto = target ? pick(con) : pick(solo)
 let gif = getGifRandom('angry', jid) || getGifRandom('enojado', jid) || getGifRandom('enojo', jid)
 if(!gif) return sock.sendMessage(jid, { text: `${texto}\n\n⚠️ No hay gifs, un staff tiene que hacer .addgif angry` }, { quoted: m })
 await sock.sendMessage(jid, { video: gif.buffer, mimetype: 'video/mp4', fileName: 'angry.mp4', gifPlayback: true, caption: texto, mentions: target ? [sender, target] : [sender] }, { quoted: m })
}
export default handler
