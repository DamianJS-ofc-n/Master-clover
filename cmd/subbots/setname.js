import { saveSubConfig, getSubs } from '../../lib/jadi.js'
import { savePrincipalConfig, getPrincipals } from '../../lib/principals.js'

export const handler = {}
handler.name = 'setname'
handler.alias = ['setbotname', 'cambiarnombre']
handler.category = 'subbots'

handler.exec = async (sock, m, args) => {
 const jid = m.key.remoteJid
 const text = args.join(' ').trim()
 if(!text) return sock.sendMessage(jid, { text:'❌ Usa: .setname Nuevo Nombre' }, { quoted:m })

 const esSubBot = sock.isSubBot === true
 const esPrincipal = sock.isPrincipal === true
 let num = sock.principalNumber || sock.subNumber || sock?.user?.id?.split(':')[0]?.replace(/\D/g,'') || ''
 num = String(num).replace(/\D/g,'')

 const tipo = esSubBot ? 'SUBBOT 🤖' : 'PRINCIPAL 👑'

 if(esSubBot){
 saveSubConfig(num, { name: text, botName: text })
 if(sock.subConfig){ sock.subConfig.name = text; sock.subConfig.botName = text }
 const sub = getSubs().get(num)
 if(sub){ sub.config.name = text; sub.config.botName = text }
 } else if(esPrincipal){
 savePrincipalConfig(num, { name: text, botName: text })
 if(sock.principalConfig){ sock.principalConfig.name = text; sock.principalConfig.botName = text }
 if(sock.subConfig){ sock.subConfig.name = text; sock.subConfig.botName = text }
 const pri = getPrincipals().get(num)
 if(pri){ pri.config.name = text; pri.config.botName = text }
 } else {
 global.botName = text
 }

 await sock.sendMessage(jid, { text:`⭐ Nombre cambiado correctamente ahora el bot se llamara: *${text}*\n📌 Tipo: ${tipo}` }, { quoted:m })
}
export default handler
