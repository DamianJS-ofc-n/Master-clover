import { ensureDB, comicBox, COIN, formatMoney } from '../../core/economy.js'
export const handler = {}; handler.name='reg'; handler.alias=['registrar','register']; handler.category='Economy'
handler.exec = async (sock, m, args) => {
 let jid=m.key.remoteJid, who=m.key.participant||m.participant||m.key.remoteJid
 let text=args.join(' '); if(!text) return sock.sendMessage(jid,{text:'✳️ Usa: .reg Manolo/16'},{quoted:m})
 let parts=text.includes('/')?text.split('/'):text.split('|'); let name=(parts[0]||'').trim(); let age=parseInt(parts[1])
 if(!name||!age) return sock.sendMessage(jid,{text:'❌ Ej: .reg Manolo/16'},{quoted:m})
 let e=ensureDB(who); if(e.registered) return sock.sendMessage(jid,{text:`⚠️ Ya estás registrado como ${e.name}`},{quoted:m})
 e.name=name; e.age=age; e.registered=true; e.money=500; e.bank=0; e.level=1; e.exp=0; global.saveDB?.()
 await sock.sendMessage(jid,{text:comicBox(`✅ ${name} se registró correctamente\n🎂 Edad: ${age}\n💰 Recibiste ${formatMoney(500)} ${COIN} de bono\nUsa .bal para ver tu cartera`)},{quoted:m})
}
