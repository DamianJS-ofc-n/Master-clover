export const handler = {}
handler.name = 'cumpleaños'
handler.alias = ['cumple', 'birthday', 'felizcumple']
handler.category = 'rpg'
handler.description = 'Felicitar por cumpleaños'

const fotos = [
 'https://raw.githubusercontent.com/starlyn-chann/Mistic-star/main/tourl/1793577494590-RW0Tyijj3Vg3.jpg',
 'https://raw.githubusercontent.com/starlyn-chann/Mistic-star/main/tourl/1793577503029-YlfeNbZdOntG.jpg',
 'https://raw.githubusercontent.com/starlyn-chann/Mistic-star/main/tourl/1793577499027-3W5K3odHFhXX.jpg'
]

const textos = [
 "🎉 ¡Feliz cumpleaños @user! 🎂 Que hoy la pases increíble, que se te cumplan todos tus deseos. Te desea LYA 🌾",
 "🎂 ¡Hoy está de fiesta @user! 🥳 Que Dios te bendiga con muchos años más, salud y locuras. ¡Felicidades!",
 "🎈 ¡Feliz vida @user! 🎁 Que este nuevo año te traiga puro éxito y joda. ¡Que los cumplas feliz!",
 "🎊 ¡Felicidades @user! 🎉 Hoy es tu día, disfrútalo al máximo, come mucho pastel y olvídate de la dieta por hoy 😎",
 "💖 ¡Feliz cumple @user! 🌟 Gracias por existir y hacer el grupo más divertido. Te queremos mucho!",
 "🥳 ¡Wujuuu es el cumple de @user! 🎂 Que la pases de locos, te mereces lo mejor del mundo hoy y siempre",
 "🎁 ¡Hoy cumple años una personita especial! @user 🎉 Que todos tus sueños se hagan realidad, ¡feliz cumpleaños!"
]

handler.exec = async (sock, m) => {
 let jid = m.key.remoteJid
 let sender = m.key.participant || m.key.remoteJid
 
 let mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
 let target = mentioned || sender
 let name = target.split('@')[0]

 let fotoRandom = fotos[Math.floor(Math.random() * fotos.length)]
 let textoRandom = textos[Math.floor(Math.random() * textos.length)].replace(/@user/g, `@${name}`)

 await sock.sendMessage(jid, {
 image: { url: fotoRandom },
 caption: textoRandom,
 mentions: [target]
 }, { quoted: m })
}

export default handler
