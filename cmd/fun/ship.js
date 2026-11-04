export const handler = {}
handler.name = 'ship'
handler.alias = ['compatibilidad','amor']
handler.category = 'fun'
handler.exec = async (sock,m)=>{
 const chat=m.key.remoteJid
 let t = m.mentionedJid?.[0]
 let s = m.key.participant || m.key.remoteJid
 if(!t) return sock.sendMessage(chat, { text: `💘 Menciona a 2: .ship @uno @dos\nO .ship @alguien (contigo)` }, { quoted: m })
 let s2 = t
 let s1 = m.mentionedJid?.[1] ? m.mentionedJid[0] : s
 if(m.mentionedJid?.[1]) s2 = m.mentionedJid[1]
 let pct = Math.floor(Math.random()*101)
 let bar = '█'.repeat(Math.floor(pct/10)) + '░'.repeat(10-Math.floor(pct/10))
 let txt = `💘 *SHIP*\n\n@${s1.split('@')[0]} ❤️ @${s2.split('@')[0]}\n\n${bar} ${pct}%\n`
 txt += pct>80 ? '💍 ¡Se casan!' : pct>50 ? '😏 Hay chance' : '💔 Mejor amigos'
 return sock.sendMessage(chat, { text: txt, mentions:[s1,s2] }, { quoted: m })
}
