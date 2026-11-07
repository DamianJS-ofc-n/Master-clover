import { getGifRandom } from '../../lib/gifs.js'
export const handler = {}
handler.name = 'abrazo'
handler.alias = ['hug', 'abrazar']
handler.category = 'reacciones'
handler.exec = async (sock, m) => {
 let jid = m.key.remoteJid
 let target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.message?.extendedTextMessage?.contextInfo?.participant
 let sender = m.key.participant || m.key.remoteJid
 let pick = a => a[Math.floor(Math.random()*a.length)]
 let con = [
 `@${sender.split('@')[0]} abrazó a @${target?.split('@')[0]} (⁠つ⁠✧⁠ω⁠✧⁠)⁠つ`,
 `@${sender.split('@')[0]} le dio un abrazo fuerte a @${target?.split('@')[0]} ʕ⁠っ⁠•⁠ᴥ⁠•⁠ʔ⁠っ`,
 `@${sender.split('@')[0]} fue corriendo a abrazar a @${target?.split('@')[0]} ฅ⁠^⁠•⁠ﻌ⁠•⁠^⁠ฅ`,
 `@${sender.split('@')[0]} abraza a @${target?.split('@')[0]} por mucho tiempo (⁠つ⁠✧⁠ω⁠✧⁠)⁠つ`,
 `@${sender.split('@')[0]} se aferra a @${target?.split('@')[0]} y no lo suelta ʕ⁠っ⁠•⁠ᴥ⁠•⁠ʔ⁠っ`
 ]
 let solo = [`@${sender.split('@')[0]} se da un abrazo a si mismo (⁠つ⁠✧⁠ω⁠✧⁠)⁠つ`, `@${sender.split('@')[0]} se abraza solo porque nadie lo abrazo hoy ʕ⁠っ⁠•⁠ᴥ⁠•⁠ʔ⁠っ`, `@${sender.split('@')[0]} se da un autoabrazo ฅ⁠^⁠•⁠ﻌ⁠•⁠^⁠ฅ`]
 let texto = target ? pick(con) : pick(solo)
 let gif = getGifRandom('abrazo', jid) || getGifRandom('hug', jid) || getGifRandom('abrazar', jid)
 if(!gif) return sock.sendMessage(jid, { text: `${texto}\n\n⚠️ No hay gifs, un staff tiene que hacer .addgif abrazo respondiendo a un GIF` }, { quoted: m })
 await sock.sendMessage(jid, { video: gif.buffer, mimetype: 'video/mp4', fileName: 'abrazo.mp4', gifPlayback: true, caption: texto, mentions: target ? [sender, target] : [sender] }, { quoted: m })
}
export default handler
