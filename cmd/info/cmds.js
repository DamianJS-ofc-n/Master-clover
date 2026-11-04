import fs from 'fs'
import path from 'path'
export const handler = {}
handler.name = 'cmds'
handler.alias = ['totalcmd']
handler.category = 'info'
handler.exec = async (sock, m) => {
 let total = 0
 try{
 const walk = (dir)=>{
 for(let f of fs.readdirSync(dir)){
 let full = path.join(dir,f)
 if(fs.statSync(full).isDirectory()) walk(full)
 else if(full.endsWith('.js')) total++
 }
 }
 walk('./cmd')
 }catch{ total = 190 }
 return sock.sendMessage(m.key.remoteJid, { text: `❀ *El bot tiene ${total} comandos*` }, { quoted: m })
}
