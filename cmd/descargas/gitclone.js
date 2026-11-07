export const handler = {}
handler.name = 'gitclone'
handler.alias = ['git']
handler.category = 'descargas'

const regexLink = /^(?:https:\/\/|git@)github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?$/i
const regexUserRepo = /^([^\/\s]+)\/([^\/\s]+?)(?:\.git)?$/
const ultimasBusquedas = new Map() // chatId -> [repos]

function formatDate(n, locale = 'es') {
 const d = new Date(n)
 return d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function infoRepo(repo, i = null) {
 let num = i !== null ? `❀ Resultado: ${i+1}\n` : ''
 return `${num}Creador: ${repo.owner.login}\nNombre: ${repo.name}\nCreado: ${formatDate(repo.created_at)}\nEstrellas: ⭐ ${repo.stargazers_count} | Forks: ${repo.forks_count}\nDesc: ${repo.description || 'Sin descripción'}\nLink: ${repo.clone_url}`
}

async function descargarRepo(sock, m, from, repo) {
 try {
 await sock.sendMessage(from, { text: `📦 Descargando *${repo.full_name}*...` }, { quoted: m })
 const zipRes = await fetch(`https://api.github.com/repos/${repo.owner.login}/${repo.name}/zipball`, { headers: { 'User-Agent': 'WhatsApp-Bot' } })
 if (!zipRes.ok) throw new Error(`GitHub respondió ${zipRes.status}`)
 const zipBuffer = Buffer.from(await zipRes.arrayBuffer())
 let zipName = `${repo.name}-${repo.owner.login}.zip`

 await sock.sendMessage(from, { image: { url: repo.owner.avatar_url }, caption: infoRepo(repo) }, { quoted: m })
 await sock.sendMessage(from, { document: zipBuffer, fileName: zipName, mimetype: 'application/zip' }, { quoted: m })
 } catch (e) {
 await sock.sendMessage(from, { text: `❌ Error al descargar: ${e.message}` }, { quoted: m })
 }
}

handler.exec = async (sock, m) => {
 const from = m.key.remoteJid
 const body = m.message?.conversation || m.message?.extendedTextMessage?.text || ''
 const text = body.trim().split(/ +/).slice(1).join(' ')
 if (!text) return await sock.sendMessage(from, { text: 'Usa:\n.gitclone <link>\n.gitclone <usuario/repo>\n.gitclone <palabra clave>\n.gitclone 3 (para bajar el 3ro de la última búsqueda)' }, { quoted: m })

 try {
 // 1) SOLO NUMERO -> baja de la ultima busqueda de ese chat
 if (/^\d+$/.test(text.trim())) {
 let num = parseInt(text.trim())
 let lista = ultimasBusquedas.get(from)
 if (!lista || !lista[num - 1]) return await sock.sendMessage(from, { text: `⚠️ No hay resultado ${num}. Primero buscá con:\n.gitclone <palabra>` }, { quoted: m })
 return await descargarRepo(sock, m, from, lista[num - 1])
 }

 // 2) LINK DIRECTO -> descarga directo
 let matchLink = text.match(regexLink)
 if (matchLink) {
 let [, user, repo] = matchLink
 let repoRes = await fetch(`https://api.github.com/repos/${user}/${repo}`, { headers: { 'User-Agent': 'WhatsApp-Bot' } })
 let repoData = await repoRes.json()
 if (repoData.message) return await sock.sendMessage(from, { text: `❌ No se encontró: ${user}/${repo}` }, { quoted: m })
 return await descargarRepo(sock, m, from, repoData)
 }

 // 3) USUARIO/REPO -> descarga directo
 let matchUserRepo = text.trim().match(regexUserRepo)
 if (matchUserRepo && !text.includes(' ')) {
 let [, user, repo] = matchUserRepo
 let repoRes = await fetch(`https://api.github.com/repos/${user}/${repo}`, { headers: { 'User-Agent': 'WhatsApp-Bot' } })
 let repoData = await repoRes.json()
 if (repoData.message) return await sock.sendMessage(from, { text: `❌ No se encontró: ${user}/${repo}` }, { quoted: m })
 return await descargarRepo(sock, m, from, repoData)
 }

 // 4) PALABRA CLAVE + NUMERO al final: ".gitclone wa bot 3" -> busca y baja el 3ro
 let numFinal = null
 let query = text
 let mNum = text.match(/\s+(\d+)$/)
 if (mNum) {
 numFinal = parseInt(mNum[1])
 query = text.replace(/\s+\d+$/, '').trim()
 }

 // 5) PALABRA CLAVE -> busca 10 resultados
 const res = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=10&sort=stars&order=desc`, { headers: { 'User-Agent': 'WhatsApp-Bot' } })
 const json = await res.json()
 if (!json.items?.length) return await sock.sendMessage(from, { text: 'Sin resultados' }, { quoted: m })

 ultimasBusquedas.set(from, json.items)

 // si puso numero, descarga ese directo
 if (numFinal) {
 if (!json.items[numFinal - 1]) return await sock.sendMessage(from, { text: `⚠️ Solo hay ${json.items.length} resultados` }, { quoted: m })
 return await descargarRepo(sock, m, from, json.items[numFinal - 1])
 }

 // si es solo palabra clave, muestra los 10 sin descargar
 let lista = json.items.map((repo, i) => `*${i+1}.* ${repo.full_name} ⭐ ${repo.stargazers_count}\n ${repo.description ? repo.description.slice(0, 80) : 'Sin descripción'}\n ${repo.html_url}`).join('\n\n')

 await sock.sendMessage(from, {
 image: { url: json.items[0].owner.avatar_url },
 caption: `🔍 *10 resultados para:* ${query}\n\n${lista}\n\n━━━━━━━━━━━━\nPara descargar uno, responde:\n.gitclone <número> Ej: .gitclone 3\nO directo: .gitclone ${json.items[0].full_name}`
 }, { quoted: m })

 } catch (e) {
 await sock.sendMessage(from, { text: `Error: ${e.message}` }, { quoted: m })
 }
}
export default handler
