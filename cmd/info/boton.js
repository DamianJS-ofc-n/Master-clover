export const handler = {}
handler.name = 'boton'
handler.alias = ['btn', 'testbtn']
handler.category = 'general'
handler.exec = async (sock, m, args) => {
 let jid = m.key.remoteJid
 let texto = args.join(' ') || "Escribe el texto que quieres probar\nEj: .boton Hola mundo"

 await sock.sendMessage(jid, {
 text: texto,
 footer: "Anubis-Bot",
 buttons: [
 {
 buttonId: ".menu",
 buttonText: { displayText: "Menu" },
 type: 1
 },
 {
 buttonId: ".ping",
 buttonText: { displayText: "Ping" },
 type: 1
 },
 {
 buttonId: ".creator",
 buttonText: { displayText: "Creador" },
 type: 1
 }
 ],
 headerType: 1,
 viewOnce: true
 }, { quoted: m })
}
