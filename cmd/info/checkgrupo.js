export const handler = {}
handler.name = 'checkgrupo'
handler.alias = ['checkgroup', 'cgrupo', 'infogrupo']
handler.category = 'info'

handler.exec = async (sock, m, a) => {
 const chatId = m.key.remoteJid
 let input = (Array.isArray(a) ? a.join(" ") : "").trim()

 const formatInfo = (data) => {
 return `────────────────────
· · ──────── ·· ──────── · ·
├┈ ✦ INFO ✦
├• ✐; GRUPO . 🌌
╰─────── ✦・⚔️・✦ ───────

⚔️ 𝙉𝙤𝙢𝙗𝙧𝙚:
├• ✐; ${data.name}

📊 𝙈𝙞𝙚𝙢𝙗𝙧𝙤𝙨:
├• ✐; ${data.members} Usuarios Activos

👾 𝘿𝙚𝙨𝙘𝙧𝙞𝙥𝙘𝙞𝙤𝙣:
${data.descLines}

📅 𝘾𝙧𝙚𝙖𝙙𝙤:
├• ✐; ${data.creation}

🛡️ 𝙀𝙨𝙩𝙖𝙙𝙤:
├• ✐; ${data.estado}

🔗 𝙇𝙞𝙣𝙠:
├• ✐; ${data.link}

🆔 𝙄𝘿:
├• ✐; ${data.id}
╰─────── ✦・🚀・✦ ───────
────────────────────`
 }

 // FIX: descripcion SIN el ├• ✐;
 const formatDesc = (desc) => {
 if (!desc || desc === 'Sin descripción') return `Sin descripción`
 return desc.split('\n').map(l => l.trim()).filter(l => l.length).join('\n')
 }

 if (!input && chatId.endsWith('@g.us')) {
 try {
 const meta = await sock.groupMetadata(chatId)
 return sock.sendMessage(chatId, { text: formatInfo({
 name: meta.subject || 'Sin nombre',
 members: meta.participants?.length || 0,
 descLines: formatDesc(meta.desc),
 creation: meta.creation ? new Date(meta.creation * 1000).toLocaleDateString('es-ES') : 'Desconocida',
 estado: '✅ Activo | No Baneado',
 link: 'Sin link - Grupo actual',
 id: meta.id
 })}, { quoted: m })
 } catch(e) {
 return sock.sendMessage(chatId, { text: `❌ ${e.message}` }, { quoted: m })
 }
 }

 if (!input) return sock.sendMessage(chatId, { text: "✳️ .checkgrupo link\nEj: .checkgrupo https://chat.whatsapp.com/KnFKXmiKPzQ09ZHkxGsI04" }, { quoted: m })

 let code = input.trim()
 if (code.includes("chat.whatsapp.com/")) code = code.split("chat.whatsapp.com/")[1].split("/")[0].split("?")[0].split(" ")[0]
 if (code.includes("invite/")) code = code.split("invite/")[1].split("/")[0]

 try {
 let info = null
 try { info = await sock.groupGetInviteInfo(code) } catch(e) {
 let msg = (e?.message || '').toLowerCase()
 let status = e?.data?.statusCode || e?.status || 0
 if (msg.includes('banned') || msg.includes('baneado') || msg.includes('deleted') || msg.includes('eliminado') || status === 410 || status === 403) {
 return sock.sendMessage(chatId, { text: formatInfo({
 name: 'Desconocido',
 members: '-',
 descLines: `No disponible, el grupo fue baneado o eliminado`,
 creation: 'Desconocida',
 estado: '🚫 Baneado / Eliminado',
 link: `https://chat.whatsapp.com/${code}`,
 id: 'Desconocido'
 })}, { quoted: m })
 }
 if (msg.includes('not found') || msg.includes('revoked') || msg.includes('revocado') || msg.includes('invalid') || status === 404) {
 return sock.sendMessage(chatId, { text: formatInfo({
 name: 'Desconocido',
 members: '-',
 descLines: `El link fue revocado o el grupo ya no existe`,
 creation: 'Desconocida',
 estado: '⚠️ Link Revocado / No Existe',
 link: `https://chat.whatsapp.com/${code}`,
 id: 'Desconocido'
 })}, { quoted: m })
 }
 throw e
 }
 if (!info) throw new Error("No pude obtener datos del grupo")

 await sock.sendMessage(chatId, { text: formatInfo({
 name: info.subject || 'Sin nombre',
 members: info.size ?? info.participants?.length ?? 0,
 descLines: formatDesc(info.desc),
 creation: info.creation ? new Date(info.creation * 1000).toLocaleDateString('es-ES') : 'Desconocida',
 estado: '✅ Activo | No Baneado',
 link: `https://chat.whatsapp.com/${code}`,
 id: info.id || 'Desconocido'
 })}, { quoted: m })

 } catch(e) {
 console.error(e)
 await sock.sendMessage(chatId, { text: `❌ ${e.message}` }, { quoted: m })
 }
}
export default handler
