import { comicBox } from '../../core/economy.js'
export const handler = {}; handler.name='baltop'; handler.category='Economy'
handler.exec = async (sock,m)=>{
 let jid=m.key.remoteJid
 let users=Object.entries(global.db.data.users||{}).filter(([,u])=>u.economy?.registered).sort((a,b)=> (b[1].economy.money+b[1].economy.bank) - (a[1].economy.money+a[1].economy.bank)).slice(0,10)
 let txt=users.map(([id,u],i)=>`${i+1}. ${u.economy.name} - $${u.economy.money+u.economy.bank}`).join('\n')||'Sin usuarios'
 await sock.sendMessage(jid,{text:comicBox(`🏆 TOP DINERO\n\n${txt}`)},{quoted:m})
}
