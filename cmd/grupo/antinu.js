export const handler = {}
handler.name = 'antinumero'
handler.alias = ['anti-numero']
handler.category = 'Admin'
handler.exec = async (sock, m, args) => {
  let jid = m.key.remoteJid
  if (!global.db.data.chats) global.db.data.chats = {}
  if (!global.db.data.chats[jid]) global.db.data.chats[jid] = { antiNumero: false }

  let opt = (args[0] || '').toLowerCase()

  if (!opt) {
    let e = global.db.data.chats[jid].antiNumero? 'ON' : 'OFF'
    return sock.sendMessage(jid, { text: `❏ ANTI-NUMERO\n✐ Estado » ❀ ${e}\n\n❏.antinumero on\n❏.antinumero off` }, { quoted: m })
  }

  if (opt == 'on') {
    global.db.data.chats[jid].antiNumero = true
    global.saveDB()
    return sock.sendMessage(jid, { text: `❏ Activado\n✐ Borrare numeros\n❀ ON` }, { quoted: m })
  }
  if (opt == 'off') {
    global.db.data.chats[jid].antiNumero = false
    global.saveDB()
    return sock.sendMessage(jid, { text: `❏ Desactivado\n❀ OFF` }, { quoted: m })
  }
}
