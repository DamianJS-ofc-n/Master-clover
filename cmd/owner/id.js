import config from '../../config.js'
export const handler = {}
handler.name = 'id'
handler.alias = ['jid','lid']
handler.category = 'owner'
handler.owner = true
function getOwners(){return (config?.bot?.owner||[]).map(n=>n.toString().split('@')[0].replace(/\D/g,'')).filter(Boolean)}
function isOwnerDirect(m){let raw=m.key?.participant||m.key?.remoteJid||'';let c=raw.split('@')[0].split(':')[0].replace(/\D/g,'');if(m.key?.fromMe)return true;return getOwners().includes(c)||config.bot.owner.includes(raw)}
handler.exec = async (sock, m) => {
 if(!isOwnerDirect(m)) return await sock.sendMessage(m.key.remoteJid, { text: '⚠️ Solo owners pueden usar esto.' }, { quoted: m })
 let txt = `*ID INFO*\n\n`
 txt += `RemoteJid: ${m.key.remoteJid}\n`
 txt += `Participant: ${m.key.participant || 'N/A'}\n`
 txt += `ParticipantAlt: ${m.key.participantAlt || 'N/A'}\n`
 txt += `LID: ${m.key.remoteJidAlt || 'N/A'}\n`
 txt += `FromMe: ${m.key.fromMe}\n`
 await sock.sendMessage(m.key.remoteJid, { text: txt }, { quoted: m })
}
export default handler
