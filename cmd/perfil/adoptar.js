import { ensureDB, isRegistered } from '../../core/economy.js'
export const handler = {}; handler.name='adoptar'; handler.alias=['adopt','hijo']; handler.category='Economy'
handler.exec = async (sock, m) => {
 let jid=m.key.remoteJid, who=m.key.participant||m.participant||m.key.remoteJid
 if(!isRegistered(who)) return sock.sendMessage(jid,{text:'✳️ Usa .reg primero'},{quoted:m})
 let mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
 if(!mentioned) return sock.sendMessage(jid,{text:'✘ Menciona a quien adoptar. Ej: .adoptar @user'},{quoted:m})
 if(mentioned===who) return sock.sendMessage(jid,{text:'✘ No puedes adoptarte a ti mismo'},{quoted:m})
 if(!isRegistered(mentioned)) return sock.sendMessage(jid,{text:'✘ Esa persona no está registrada (.reg)'},{quoted:m})

 let yo = ensureDB(who)
 if(!yo.casado) return sock.sendMessage(jid,{text:'✘ Necesitas estar casado para adoptar'},{quoted:m})
 if(mentioned===yo.casado) return sock.sendMessage(jid,{text:'✘ No puedes adoptar a tu pareja xddd'},{quoted:m})

 // crear lista si no existe
 if(!Array.isArray(yo.hijosLista)) yo.hijosLista = []
 if(!Array.isArray(ensureDB(yo.casado).hijosLista)) ensureDB(yo.casado).hijosLista = []

 if(yo.hijosLista.includes(mentioned)) return sock.sendMessage(jid,{text:'✘ Ya es tu hijo'},{quoted:m})

 let parejaName = 'Desconocido'
 try{ parejaName = ensureDB(yo.casado).name }catch{}

 // guardar hijo
 yo.hijosLista.push(mentioned)
 yo.hijos = yo.hijosLista.length
 try{
 let pareja = ensureDB(yo.casado)
 if(!pareja.hijosLista.includes(mentioned)) pareja.hijosLista.push(mentioned)
 pareja.hijos = pareja.hijosLista.length
 }catch{}

 global.saveDB?.()

 let txt = `❀ *ADOPCIÓN*
╏
╏ ░⃞⚡ Pareja » *${parejaName}*
╏ ░⃞⚡ Hijo » @${mentioned.split('@')[0]} (${ensureDB(mentioned).name})
╏ ░⃞⚡ Solicitud » *Aprobado ✓*
╏
╏ ░⃞🚀 Total hijos » *${yo.hijos}*
┗╍╍╍╍╍╍╍╍╍╍╍╍╍╍ 𖦹`

 await sock.sendMessage(jid,{text: txt, mentions: [mentioned, yo.casado, who].filter(Boolean)},{quoted:m})
}
export default handler
