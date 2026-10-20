import fs from 'fs'
export const handler={}
handler.name='setmenu'
handler.alias=['tema','theme']
handler.category='owner'
handler.description='Cambia tema del menu'
handler.exec=async(sock,m,args)=>{
 const temas=['normal','pro','galactico','hallowen','electro','simple']
 const t=(args[0]||'').toLowerCase()
 if(!t||!temas.includes(t)){
  return sock.sendMessage(m.key.remoteJid,{text:`Temas disponibles:\n${temas.map(x=>`• ${x}`).join('\n')}\n\nUso:.setmenu pro`},{quoted:m})
 }
 fs.mkdirSync('./db',{recursive:true})
 fs.writeFileSync('./db/menu_theme.json',JSON.stringify({theme:t}))
 return sock.sendMessage(m.key.remoteJid,{text:`⚔️ Tema cambiado a *${t}*`},{quoted:m})
}