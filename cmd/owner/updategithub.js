import { execSync } from 'child_process'
import fs from 'fs'

export const handler = {}
handler.name = 'updategithub'
handler.alias = ['upgit','gitpush']
handler.category = 'owner'
handler.owner = true

function exec(cmd){
 try{
 return execSync(cmd, { encoding: 'utf-8', stdio: 'pipe', timeout: 40000 }).trim()
 }catch(e){
 return (e.stdout?.toString() || '') + '\n' + (e.stderr?.toString() || e.message)
 }
}
function getToken(){
 if(process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN
 if(fs.existsSync('./db/github.json')){
 try{ return JSON.parse(fs.readFileSync('./db/github.json','utf-8')).token }catch{}
 }
 return null
}
function saveToken(token){
 if(!fs.existsSync('./db')) fs.mkdirSync('./db',{recursive:true})
 fs.writeFileSync('./db/github.json', JSON.stringify({ token, savedAt: Date.now() }))
}

handler.exec = async (sock, m, args) => {
 const jid = m.key.remoteJid
 if(!fs.existsSync('.git')) return await sock.sendMessage(jid, { text: `❌ No es repo git` }, { quoted: m })

 // NUEVO: .updategithub token ghp_xxx
 if(args[0] === 'token' || args[0] === '--token'){
 const t = args[1]
 if(!t){
 const has = getToken()
 return await sock.sendMessage(jid, { text: has ? `✅ Ya tienes token guardado\nUsa .updategithub token NUEVO_TOKEN para cambiarlo` : `❌ No tienes token\nUsa: .updategithub token ghp_xxx` }, { quoted: m })
 }
 if(!t.startsWith('ghp_') && !t.startsWith('github_pat_')){
 return await sock.sendMessage(jid, { text: `❌ Token invalido, debe empezar con ghp_ o github_pat_` }, { quoted: m })
 }
 saveToken(t)
 return await sock.sendMessage(jid, { text: `✅ Token guardado en ./db/github.json\nAhora ya puedes usar:\n.updategithub cmd` }, { quoted: m })
 }

 if(args.length === 0){
 return await sock.sendMessage(jid, { text: `📌 Uso:\n.updategithub token ghp_xxx (guardar token primero)\n.updategithub cmd (sube carpeta)\n.updategithub cmd/socket (subcarpeta)\n.updategithub main.js fix` }, { quoted: m })
 }

 let files = []
 let commitParts = []
 for(let a of args){
 if(fs.existsSync(a)){
 files.push(a)
 } else {
 commitParts.push(a)
 }
 }
 if(files.length === 0) files = ['.']

 let filesToAdd = files.map(f=> `"${f}"`).join(' ')
 let commitMsg = commitParts.join(' ') || `update ${files.join(', ')}`

 const statusBefore = exec('git status --porcelain')
 if(!statusBefore) return await sock.sendMessage(jid, { text: `✅ Nada para subir, todo al dia` }, { quoted: m })

 await sock.sendMessage(jid, { text: `⛩️ Subiendo...\n📦 ${files.join(', ')}\n💬 ${commitMsg}` }, { quoted: m })

 const branch = exec('git branch --show-current') || 'main'
 let remoteUrl = exec('git remote get-url origin')
 let token = getToken()
 let pushUrl = null
 if(token && remoteUrl.includes('github.com') && remoteUrl.startsWith('https://')){
 let clean = remoteUrl.replace('https://','').replace(/^.*@/,'')
 pushUrl = `https://${token}@${clean}`
 }

 exec(`git config user.email "bot@clover.com"`)
 exec(`git config user.name "Clover Bot"`)
 exec(`git add ${filesToAdd}`)

 exec(`git commit -m "${commitMsg.replace(/"/g,'\\"')}"`)
 let push = pushUrl ? exec(`git push ${pushUrl} ${branch} 2>&1`) : exec(`git push origin ${branch} 2>&1`)

 if(push.toLowerCase().includes('error') || push.toLowerCase().includes('fatal') || push.toLowerCase().includes('authentication failed')){
 let msg = `❌ Error push:\n${push.slice(0,1500)}\n\n`
 if(push.includes('Authentication failed')) msg += `Tu token está mal o expiró. Haz .updategithub token NUEVO`
 await sock.sendMessage(jid, { text: msg }, { quoted: m })
 } else {
 await sock.sendMessage(jid, { text: `✅ Push ok\n📦 ${files.join(', ')}\n💬 ${commitMsg}\n📌 ${exec('git log -1 --oneline')}` }, { quoted: m })
 }
}
