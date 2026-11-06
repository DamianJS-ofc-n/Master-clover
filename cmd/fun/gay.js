export const handler = {}
handler.name = 'gay'
handler.alias = ['gaymeter', 'cuantogay']
handler.category = 'fun'
handler.exec = async (sock, m) => {
 const jid = m.key.remoteJid
 const body = m.message?.conversation || m.message?.extendedTextMessage?.text || ''
 const args = body.trim().split(/\s+/).slice(1)
 const targetName = args.join(' ') || 'vos'
 const por = Math.floor(Math.random() * 101)
 let barra = '🏳️‍🌈'.repeat(Math.ceil(por / 10)) || '⬜'
 let texto = por > 80 ? 'Re gay, admitilo 😭🏳️‍🌈' : por > 50 ? 'Medio medio eh 👀' : por > 20 ? 'Tranqui, casi hetero' : 'Re hetero pa'
 await sock.sendMessage(jid, { text: `🏳️‍🌈 *MEDIDOR GAY* 🏳️‍🌈\n\n👤 *${targetName}*\n📊 *${por}% gay*\n${barra}\n\n${texto}` }, { quoted: m })
}
export default handler
