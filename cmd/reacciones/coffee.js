import { getGifRandom } from '../../lib/gifs.js'
export const handler = {}
handler.name = 'coffee'
handler.alias = ['cafe', 'café', 'tomarcafe']
handler.category = 'reacciones'
handler.exec = async (sock, m) => {
 let jid = m.key.remoteJid
 let target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.message?.extendedTextMessage?.contextInfo?.participant
 let sender = m.key.participant || m.key.remoteJid
 let pick = a => a[Math.floor(Math.random()*a.length)]
 let caras = ['ฅ⁠^⁠•⁠ﻌ⁠•⁠^⁠ฅ', '(⁠=⁠^⁠･⁠ｪ⁠･⁠^⁠=⁠)', 'ʕ⁠´⁠•⁠ᴥ⁠•̥⁠`⁠ʔ', '⊙⁠﹏⁠⊙']
 let cara = pick(caras)
 let con = [
 `@${sender.split('@')[0]} se toma un café con @${target?.split('@')[0]} ${cara}`,
 `@${sender.split('@')[0]} le invita un café a @${target?.split('@')[0]} ${cara}`,
 `@${sender.split('@')[0]} toma café charlando con @${target?.split('@')[0]} ${cara}`
 ]
 let solo = [
 `@${sender.split('@')[0]} se toma un café ${cara}`,
 `@${sender.split('@')[0]} está tomando café tranquilo ${cara}`,
 `@${sender.split('@')[0]} necesita un café ${cara}`
 ]
 let texto = target ? pick(con) : pick(solo)
 let gif = getGifRandom('coffee', jid) || getGifRandom('cafe', jid)
 if(!gif) return sock.sendMessage(jid, { text: `${texto}\n\n⚠️ No hay gifs, un staff tiene que hacer .addgif coffee` }, { quoted: m })
 await sock.sendMessage(jid, { video: gif.buffer, mimetype: 'video/mp4', fileName: 'coffee.mp4', gifPlayback: true, caption: texto, mentions: target ? [sender, target] : [sender] }, { quoted: m })
}
export default handler
