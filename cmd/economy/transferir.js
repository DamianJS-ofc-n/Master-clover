import { ensureDB, comicBox, isRegistered, COIN, formatMoney } from '../../core/economy.js'
export const handler = {}; handler.name='transferir'; handler.alias=['transfer','pay','pagar']; handler.category='Economy'
handler.exec = async (sock, m, args) => {
 let jid=m.key.remoteJid, who=m.key.participant||m.participant||m.key.remoteJid
 if(!isRegistered(who)) return sock.sendMessage(jid,{text:'✳️ .reg primero'},{quoted:m})
 let target=m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]; let amount=parseInt(args[args.length-1])
 if(!target) return sock.sendMessage(jid,{text:`💸 Usa: .transferir @usuario 100`},{quoted:m})
 if(!amount||amount<=0) return sock.sendMessage(jid,{text:'❌ Cantidad inválida'},{quoted:m})
 if(target===who) return sock.sendMessage(jid,{text:'❌ No puedes transferirte a ti mismo'},{quoted:m})
 try{ if(jid.endsWith('@g.us')){ let meta=await sock.groupMetadata(jid); if(!meta.participants.map(p=>p.id).includes(target)) return sock.sendMessage(jid,{text:'❌ Ese usuario no está en este grupo'},{quoted:m}) } }catch{}
 let eTarget=ensureDB(target); if(!eTarget.registered) return sock.sendMessage(jid,{text:`❌ ${eTarget.name} no está registrado, debe usar .reg`},{quoted:m})
 let e1=ensureDB(who); if(e1.money<amount) return sock.sendMessage(jid,{text:`❌ ${e1.name}, solo tienes ${formatMoney(e1.money)} ${COIN}`},{quoted:m})
 if(amount<10) return sock.sendMessage(jid,{text:'❌ Mínimo ¥10'},{quoted:m})
 e1.money-=amount; eTarget.money+=amount; e1.exp+=Math.floor(amount/2); global.saveDB?.()
 await sock.sendMessage(jid,{text:comicBox(`💸 ${e1.name} le transfirió ${formatMoney(amount)} ${COIN} a ${eTarget.name}\n💰 Tu saldo ahora es ${formatMoney(e1.money)} ${COIN}`),mentions:[who,target]},{quoted:m})
}
