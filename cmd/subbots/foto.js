import fs from 'fs'
import path from 'path'

export const handler = {}
handler.name = 'foto'
handler.alias = ['getfoto','verfoto']
handler.category = 'general'
handler.description = 'Ver foto guardada local'

handler.exec = async (sock, m, args) => {
  const jid = m.key.remoteJid
  const nombre = args[0]
  if(!nombre) {
    const folder = './db/fotos'
    if(!fs.existsSync(folder)) return sock.sendMessage(jid, { text: 'No hay fotos guardadas' }, { quoted: m })
    const files = fs.readdirSync(folder)
    if(files.length===0) return sock.sendMessage(jid, { text: 'No hay fotos' }, { quoted: m })
    return sock.sendMessage(jid, { text: `*Fotos guardadas:*\n${files.map(f=>`• ${f.replace('.jpg','')} ( #foto ${f.replace('.jpg','')} )`).join('\n')}` }, { quoted: m })
  }
  const filePath = path.join('./db/fotos', `${nombre}.jpg`)
  if(!fs.existsSync(filePath)) return sock.sendMessage(jid, { text: `No existe ${nombre}` }, { quoted: m })
  await sock.sendMessage(jid, { image: fs.readFileSync(filePath), caption: `📁 ${nombre}` }, { quoted: m })
}
