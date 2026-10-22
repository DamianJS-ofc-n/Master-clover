import fs from 'fs'
export const handler = {}
handler.name = 'id'
handler.alias = ['myid', 'lid']
handler.category = 'owner'
handler.exec = async (sock, m) => {
 let jid = m.key.remoteJid
 let info = `
*SENDER DEBUG*

m.sender: ${m.sender}
m.key.participant: ${m.key?.participant}
m.key.participantAlt: ${m.key?.participantAlt}
m.participant: ${m.participant}
m.key.remoteJid: ${m.key?.remoteJid}
fromMe: ${m.key?.fromMe}
isOwner flag: ${m.isOwner}

--- config.js raw ---
${(() => { try { return fs.readFileSync('config.js','utf-8').slice(0,500) } catch(e){ return e.message } })()}

--- global.owner ---
${JSON.stringify(global.owner || [])}
`
 await sock.sendMessage(jid, { text: info }, { quoted: m })
}
