import { getGifRandom } from '../../lib/gifs.js'
export const handler = {}
handler.name = 'happy'
handler.alias = ['feliz', 'alegre', 'contento']
handler.category = 'reacciones'
handler.exec = async (sock, m) => {
 let jid = m.key.remoteJid
 let target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.message?.extendedTextMessage?.contextInfo?.participant
 let sender = m.key.participant || m.key.remoteJid
 let pick = a => a[Math.floor(Math.random()*a.length)]
 let caras = ['ฅ⁠^⁠•⁠ﻌ⁠•⁠^⁠ฅ', '(⁠=⁠^⁠･⁠ｪ⁠･⁠^⁠=⁠)', 'ʕ⁠´⁠•⁠ᴥ⁠•̥⁠`⁠ʔ', '⊙⁠﹏⁠⊙']
 let cara = pick(caras)
 let con = [
 `@${sender.split('@')[0]} está feliz gracias a @${target?.split('@')[0]} ${cara}`,
 `@${sender.split('@')[0]} se pone feliz al ver a @${target?.split('@')[0]} ${cara}`,
 `@${sender.split('@')[0]} sonríe por @${target?.split('@')[0]} ${cara}`,
 `@${sender.split('@')[0]} está contento con @${target?.split('@')[0]} ${cara}`
 ]
 let solo = [
 `@${sender.split('@')[0]} está feliz ${cara}`,
 `@${sender.split('@')[0]} está contento ${cara}`,
 `@${sender.split('@')[0]} está de buen humor ${cara}`
 ]
 let texto = target ? pick(con) : pick(solo)
 let gif = getGifRandom('happy', jid) || getGifRandom('feliz', jid) || getGifRandom('alegre', jid)
 if(!gif) return sock.sendMessage(jid, { text: `${texto}\n\n⚠️ No hay gifs, un staff tiene que hacer .addgif happy` }, { quoted: m })
 await sock.sendMessage(jid, { video: gif.buffer, mimetype: 'video/mp4', fileName: 'happy.mp4', gifPlayback: true, caption: texto, mentions: target ? [sender, target] : [sender] }, { quoted: m })
}
export default handler
