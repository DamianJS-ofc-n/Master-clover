export const handler = {}
handler.name = 'setgenre'
handler.alias = ['setgenero']
handler.category = 'economy'
handler.exec = async (sock,m,a,extra)=>{
  let users=extra?.users||global?.db?.data?.users||{}
  let jid=m.key.participant||m.key.remoteJid
  if(!users[jid]) users[jid]={}
  let genre=(a[0]||'').toLowerCase()
  let valid=['hombre','mujer','otro']
  if(!valid.includes(genre)){
    return sock.sendMessage(m.key.remoteJid,{text:`《✧》 Debes ingresar un género válido: *hombre*, *mujer* u *otro*.\n> Ejemplo » *#setgenre hombre*`},{quoted:m})
  }
  users[jid].genre=genre.charAt(0).toUpperCase()+genre.slice(1)
  await sock.sendMessage(m.key.remoteJid,{text:`「✿」 Género cambiado a *${users[jid].genre}*`},{quoted:m})
  extra?.saveDB?.(); global.saveDB?.()
}
