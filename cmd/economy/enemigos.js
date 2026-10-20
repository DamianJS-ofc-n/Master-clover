import { ensureDB, comicBox, isRegistered } from '../../core/economy.js'
export const handler={}; handler.name='enemigos'; handler.alias=['mobs','bestiario']; handler.category='Economy'
handler.exec=async(sock,m)=>{let j=m.key.remoteJid,w=m.key.participant||m.participant||m.key.remoteJid;if(!isRegistered(w))return sock.sendMessage(j,{text:'✳️ .reg primero'},{quoted:m});let e=ensureDB(w);await sock.sendMessage(j,{text:comicBox(`👹 Bestiario para ${e.name}\n\nLv1-10: Slime 💧\nLv10-20: Goblin 👺\nLv20-35: Orco 👹\nLv35+: Dragón 🐉\n\nUsa .dungeon para enfrentarlos`)},{quoted:m})}
