import { ensureDB, isRegistered } from '../../core/economy.js'
export const handler = {}; handler.name='familia'; handler.alias=['family']; handler.category='Economy'
handler.exec = async (sock, m) => {
 let jid=m.key.remoteJid, who=m.key.participant||m.participant||m.key.remoteJid
 if(!isRegistered(who)) return sock.sendMessage(jid,{text:'✳️ Usa .reg primero'},{quoted:m})
 let yo = ensureDB(who)
 if(!Array.isArray(yo.hijosLista)) yo.hijosLista = []

 let pareja = 'Nadie'
 let parejaTag = null
 if(yo.casado){
 try{ pareja = ensureDB(yo.casado).name; parejaTag = yo.casado }catch{ pareja = 'Casado' }
 }

 let total = yo.hijosLista.length || yo.hijos || 0

 // mencionar hijos
 let hijosMencion = ''
 let mentions = [who]
 if(parejaTag) mentions.push(parejaTag)

 if(yo.hijosLista.length > 0){
 hijosMencion = yo.hijosLista.map(j => {
 mentions.push(j)
 try{ return `@${j.split('@')[0]}` }catch{ return '@hijo' }
 }).join(', ')
 } else {
 hijosMencion = 'Ninguno'
 }

 let txt = `◯ *INFORMACIÓN DE FAMILIA*
╏
╏ ░⃞⚡ 𝙋𝙖𝙧𝙚𝙟𝙖 » ${parejaTag ? `@${parejaTag.split('@')[0]} (${pareja})` : `*${pareja}*`}
╏ ░⃞⚡ 𝙝𝙞𝙟𝙤𝙨 <𝙖> » ${hijosMencion}
╏ ░⃞⚡ 𝙏𝙤𝙩𝙖𝙡 𝙝𝙞𝙟𝙤𝙨 » *${total}*
┗╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍ 𖦹`

 await sock.sendMessage(jid,{text: txt, mentions},{quoted:m})
}
export default handler
