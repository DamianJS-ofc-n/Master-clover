import fs from 'fs'
import path from 'path'
import { ensureDB, isRegistered, COIN, formatMoney, getRango } from '../../core/economy.js'
export const handler={}
handler.name='menurpg'
handler.alias=['rpgmenu']
handler.category='menus'
handler.exec=async(sock,m)=>{
 let jid=m.key.remoteJid
 let who=m.key.participant||m.participant||m.key.remoteJid
 let e=ensureDB(who)
 let nombre=(e.name||'').replace(/\.js$/i,'').replace(/🌀/g,'').trim()||who.split('@')[0]
 let dir=path.join(process.cwd(),'cmd/economy')
 let files=[]
 try{ files=fs.readdirSync(dir).filter(f=>f.endsWith('.js')).map(f=>f.replace('.js','')) }catch{}
 files.sort()
 let bal=formatMoney((e.money||0)+(e.bank||0))
 let text=`▭▭▭▭▭▭▭▭
🌀 *CMDS RPG ➤* ${files.length}
📊 *Rango* ➤ ${getRango(e.level||1)}
🐉 *Registrado* ➤ ${isRegistered(who)?'Si ✅':'No ❌'}
🎉 *Nivel* ➤ ${e.level||0}
🌾 *Usuario* ➤ ${nombre}
🏦 *Coins* ➤ ${bal} ${COIN}
▭▭▭▭

*🐉 MENU - RPG MASTER*
╭───────────
${files.map(f=>`│๛ ${f}`).join('\n')}
╰──────────────╯`
 await sock.sendMessage(jid,{text},{quoted:m})
}
