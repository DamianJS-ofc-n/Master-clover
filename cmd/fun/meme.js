export const handler = {}
handler.name = 'meme'
handler.alias = ['memes','randommeme']
handler.category = 'fun'
handler.exec = async (sock,m)=>{
 const memes = [
 'https://raw.githubusercontent.com/starlyn-chann/Mistic-star/main/tourl/1793756435087-rI1HOx65b3i4.jpg',
 'https://raw.githubusercontent.com/starlyn-chann/Mistic-star/main/tourl/1793756448587-uFkMsRfxYfc6.jpg',
 'https://raw.githubusercontent.com/starlyn-chann/Mistic-star/main/tourl/1793756457929-MEwnX1uIOFur.jpg',
 'https://raw.githubusercontent.com/starlyn-chann/Mistic-star/main/tourl/1793756463132-wf0LrZQvjfNR.jpg',
 'https://raw.githubusercontent.com/starlyn-chann/Mistic-star/main/tourl/1793756470098-bCCkxHnRtYrM.jpg'
 ]
 let url = memes[Math.floor(Math.random()*memes.length)]
 return sock.sendMessage(m.key.remoteJid, { image: { url }, caption: `😂 *MEME RANDOM* - ${memes.length} memes` }, { quoted: m })
}
