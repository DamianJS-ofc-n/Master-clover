export const handler = {}
handler.name = 'gitclone'
handler.alias = ['git']
handler.category = 'descargas'
const regex = /^(?:https:\/\/|git@)github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?$/i;
function formatDate(n, locale = 'es') {
 const d = new Date(n);
 return d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
handler.exec = async (sock, m) => {
 const from = m.key.remoteJid
 const body = m.message?.conversation || m.message?.extendedTextMessage?.text || ''
 const text = body.trim().split(/ +/).slice(1).join(' ')
 if (!text) return await sock.sendMessage(from, { text: 'Usa:.gitclone <link o nombre>' }, { quoted: m })
 try {
 let info = ''; let image; let zipBuffer, zipName; let repos = [];
 const match = text.match(regex);
 if (match) {
 const [, user, repo] = match;
 const repoRes = await fetch(`https://api.github.com/repos/${user}/${repo}`);
 const zipRes = await fetch(`https://api.github.com/repos/${user}/${repo}/zipball`);
 const repoData = await repoRes.json();
 zipName = `${repo}-${user}.zip`;
 zipBuffer = Buffer.from(await zipRes.arrayBuffer());
 repos.push(repoData);
 image = 'https://cdn.yuki-wabot.my.id/files/MqnN.jpeg';
 } else {
 const res = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(text)}`);
 const json = await res.json();
 if (!json.items.length) return await sock.sendMessage(from, { text: 'Sin resultados' }, { quoted: m })
 const repo = json.items[0];
 const zipRes = await fetch(`https://api.github.com/repos/${repo.owner.login}/${repo.name}/zipball`);
 zipName = `${repo.name}-${repo.owner.login}.zip`;
 zipBuffer = Buffer.from(await zipRes.arrayBuffer());
 repos.push(repo);
 image = repo.owner.avatar_url;
 }
 info = repos.map((repo, i) => `Resultado: ${i+1}\nCreador: ${repo.owner.login}\nNombre: ${repo.name}\nCreado: ${formatDate(repo.created_at)}\nEstrellas: ${repo.stargazers_count}\nLink: ${repo.clone_url}`).join('\n---\n');
 await sock.sendMessage(from, { image: { url: image }, caption: info }, { quoted: m })
 if (zipBuffer) await sock.sendMessage(from, { document: zipBuffer, fileName: zipName, mimetype: 'application/zip' }, { quoted: m })
 } catch (e) { await sock.sendMessage(from, { text: `Error: ${e.message}` }, { quoted: m }) }
}
