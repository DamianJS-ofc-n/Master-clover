import { getGifRandom } from '../../lib/gifs.js'
export const handler = {}
handler.name = 'eat'
handler.alias = ['comer', 'comiendo']
handler.category = 'reacciones'
handler.exec = async (sock, m) => {
 let jid = m.key.remoteJid
 let target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.message?.extendedTextMessage?.contextInfo?.participant
 let sender = m.key.participant || m.key.remoteJid
 let pick = a => a[Math.floor(Math.random()*a.length)]
 let caras = ['ฅ⁠^⁠•⁠ﻌ⁠•⁠^⁠ฅ', '(⁠=⁠^⁠･⁠ｪ⁠･⁠^⁠=⁠)', 'ʕ⁠´⁠•⁠ᴥ⁠•̥⁠`⁠ʔ', '⊙⁠﹏⁠⊙']
 let cara = pick(caras)
 let con = [
 `@${sender.split('@')[0]} se pone a comer con @${target?.split('@')[0]} ${cara}`,
 `@${sender.split('@')[0]} le invita comida a @${target?.split('@')[0]} ${cara}`,
 `@${sender.split('@')[0]} come junto a @${target?.split('@')[0]} ${cara}`,
 `@${sender.split('@')[0]} le roba la comida a @${target?.split('@')[0]} ${cara}`
 ]
 let solo = [
 `@${sender.split('@')[0]} se pone a comer ${cara}`,
 `@${sender.split('@')[0]} tiene hambre y come ${cara}`,
 `@${sender.split('@')[0]} está comiendo rico ${cara}`
 ]
 let texto = target ? pick(con) : pick(solo)
 let gif = getGifRandom('eat', jid) || getGifRandom('comer', jid) || getGifRandom('comiendo', jid)
 if(!gif) return sock.sendMessage(jid, { text: `${texto}\n\n⚠️ No hay gifs, un staff tiene que hacer .addgif eat` }, { quoted: m })
 await sock.sendMessage(jid, { video: gif.buffer, mimetype: 'video/mp4', fileName: 'eat.mp4', gifPlayback: true, caption: texto, mentions: target ? [sender, target] : [sender] }, { quoted: m })
}
export default handler
