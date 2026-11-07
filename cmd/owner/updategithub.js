import config from '../../config.js'
import { execSync } from 'child_process'
import fs from 'fs'
export const handler = {}
handler.name = 'updategithub'
handler.alias = ['upgit','gitpush']
handler.category = 'owner'
handler.owner = true

function getOwners(){return (config?.bot?.owner||[]).map(n=>n.toString().split('@')[0].replace(/\D/g,'')).filter(Boolean)}
function isOwnerDirect(m){let raw=m.key?.participant||m.key?.remoteJid||'';let clean=raw.split('@')[0].split(':')[0].replace(/\D/g,'');if(m.key?.fromMe)return true;return getOwners().includes(clean)||config.bot.owner.includes(raw)}
function exec(cmd){try{ return execSync(cmd, { encoding: 'utf-8', stdio: 'pipe', timeout: 60000 }).trim() }catch(e){ return ((e.stdout?.toString()||'')+'\n'+(e.stderr?.toString()||e.message)).trim() }}
function getToken(){if(process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;if(fs.existsSync('./db/github.json')){ try{ return JSON.parse(fs.readFileSync('./db/github.json','utf-8')).token }catch{} }return null}
function saveToken(token){if(!fs.existsSync('./db')) fs.mkdirSync('./db',{recursive:true});fs.writeFileSync('./db/github.json', JSON.stringify({ token, savedAt: Date.now() }))}

handler.exec = async (sock, m, args) => {
 if(!isOwnerDirect(m)) return await sock.sendMessage(m.key.remoteJid, { text: '⚠️ Solo owners pueden usar esto.' }, { quoted: m })
 const jid = m.key.remoteJid
 if(!fs.existsSync('.git')) return await sock.sendMessage(jid, { text: `❌ No es repo git` }, { quoted: m })
 if(args[0] === 'token' || args[0] === '--token'){
 const t = args[1]
 if(!t) return await sock.sendMessage(jid, { text: getToken() ? `✅ Ya tienes token` : `❌ Usa: .updategithub token ghp_xxx` }, { quoted: m })
 if(!t.startsWith('ghp_') && !t.startsWith('github_pat_')) return await sock.sendMessage(jid, { text: `❌ Token invalido` }, { quoted: m })
 saveToken(t); return await sock.sendMessage(jid, { text: `✅ Token guardado` }, { quoted: m })
 }
 // nuevo: ver que esta ignorado
 if(args[0] === 'check' || args[0] === 'ignored'){
 let target = args[1] || '.'
 let out = exec(`git check-ignore -v "${target}" 2>&1; echo "---"; git status --porcelain "${target}" | head -n 50; echo "---"; git ls-files "${target}" | head -n 50`)
 return await sock.sendMessage(jid, { text: `🔍 *CHECK ${target}*\n\n${out.slice(0,3500) || 'Sin salida'}\n\nSi sale algo en check-ignore, esa carpeta esta ignorada por .gitignore` }, { quoted: m })
 }
 if(args.length === 0) return await sock.sendMessage(jid, { text: `Uso:\n.updategithub token ghp_xxx\n.updategithub cmd\n.updategithub cmd/pokemon\n.updategithub cmd/pokemon fix poke\n.updategithub check cmd/pokemon\n.updategithub . todo` }, { quoted: m })

 let files = [], commitParts = []
 for(let a of args){
 if(a === '--force' || a === '-f'){ commitParts.push('__FORCE__'); continue }
 if(fs.existsSync(a)){ files.push(a) } else { commitParts.push(a) }
 }
 let force = commitParts.includes('__FORCE__')
 commitParts = commitParts.filter(c => c !== '__FORCE__')
 if(files.length === 0) files = ['.']
 let commitMsg = commitParts.join(' ') || `update ${files.join(', ')}`
 const branch = exec('git branch --show-current') || 'main'
 let remoteUrl = exec('git remote get-url origin')
 let token = getToken()
 let pushUrl = null
 if(token && remoteUrl.includes('github.com') && remoteUrl.startsWith('https://')){let clean = remoteUrl.replace('https://','').replace(/^.*@/,'');pushUrl = `https://${token}@${clean}`}

 // que hay adentro de la carpeta REAL, no lo que git quiere mostrar
 let realFiles = []
 for(let f of files){
 if(fs.statSync(f).isDirectory()){
 let list = exec(`find "${f}" -type f | head -n 100`)
 realFiles.push(`📁 ${f} (${list.split('\n').filter(Boolean).length} archivos en disco, primeros 100)`)
 } else realFiles.push(`📄 ${f}`)
 }
 await sock.sendMessage(jid, { text: `⛩️ Subiendo...\n${realFiles.join('\n')}\n📌 Branch: ${branch}${force ? '\n⚠️ Con --force (ignora .gitignore)' : ''}` }, { quoted: m })

 exec(`git config user.email "bot@clover.com"`); exec(`git config user.name "Clover Bot"`)
 // FIX PRINCIPAL: -A recursivo + -f si es carpeta o si pedis --force
 for(let f of files){
 if(fs.statSync(f).isDirectory()){
 exec(`git add -A "${f}"`)
 exec(`git add -f "${f}"`)
 } else {
 exec(`git add -f "${f}"`)
 }
 }
 let statusAfter = exec('git status --porcelain')
 if(!statusAfter){
 // si no hay nada staged, puede ser que todo ya estaba subido o que estaba ignorado y no se pudo
 let ignored = exec(`git check-ignore -v ${files.map(f=>`"${f}"`).join(' ')} 2>&1`)
 return await sock.sendMessage(jid, { text: `✅ Nada para subir (ya estaba todo subido)\n\n🔍 Check-ignore:\n${ignored.slice(0,1500) || 'No ignorado'}\n\nSi sabias que habia archivos nuevos, usá:\n.updategithub ${files.join(' ')} --force\nY fijate tu .gitignore` }, { quoted: m })
 }
 let staged = exec('git diff --cached --name-only | head -n 100')
 exec(`git commit -m "${commitMsg.replace(/"/g,'\\"')}"`)
 let push = pushUrl ? exec(`git push ${pushUrl} ${branch} 2>&1`) : exec(`git push origin ${branch} 2>&1`)
 if(push.toLowerCase().includes('error') || push.toLowerCase().includes('failed')){
 await sock.sendMessage(jid, { text: `❌ Error push:\n${push.slice(0,3500)}` }, { quoted: m })
 } else {
 await sock.sendMessage(jid, { text: `✅ Push ok\n📦 ${files.join(', ')}\n📄 Archivos subidos (${staged.split('\n').filter(Boolean).length}):\n${staged.slice(0,2000)}\n📌 ${exec('git log -1 --oneline')}` }, { quoted: m })
 }
}
export default handler
