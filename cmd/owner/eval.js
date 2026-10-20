import config from '../../config.js'
import util from 'util'

export const handler = {}
handler.name = 'eval'
handler.alias = ['ev', 'execjs']
handler.category = 'owner'
handler.description = 'Ejecuta código JS (solo owner)'
handler.owner = true

handler.exec = async (sock, m, args, extra) => {
 const jid = m.key.remoteJid
 const sender = m.key.participant || m.key.remoteJid
 const senderLid = extra?.senderLid || sender

 const owners = config.bot?.owner || config.owner || []
 const isOwner = owners.includes(sender) || owners.includes(senderLid) || owners.some(o => sender.includes(o.split('@')[0]))
 if (!isOwner) return await sock.sendMessage(jid, { text: '❌ Solo owners.' }, { quoted: m })

 if (!args.args?.length && !args.length) return await sock.sendMessage(jid, { text: `Uso:.eval config.bot.name` }, { quoted: m })

 let code = (args.args || args).join(' ')
 try {
 const conn = sock
 const db = global.db
 const m2 = m

 let result = await eval(code)
 if (typeof result!== 'string') result = util.inspect(result, { depth: 3 })
 if (result.length > 3500) result = result.slice(0, 3500) + '\n...recortado'
 await sock.sendMessage(jid, { text: `*EVAL - Resultado:*\n\n\`\`\`js\n${result}\n\`\`\`` }, { quoted: m })
 } catch (e) {
 await sock.sendMessage(jid, { text: `*EVAL - Error:*\n\n\`\`\`js\n${e.message}\n\`\`\`` }, { quoted: m })
 }
}
