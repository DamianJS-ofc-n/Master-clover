import { createJadiBot } from '../../lib/jadi.js'
import config from '../../config.js'

export const handler = {}
handler.name = 'code'
handler.alias = ['jadibot','serbot','codebot','botcode','qr']
handler.category = 'owner'
handler.owner = false

const clean = (n='') => String(n).replace(/\D/g,'')

handler.exec = async (...args) => {
 let sock, m, a
 if (args[0]?.key) { m = args[0]; sock = args[1]?.conn || global.conn; a = args[1]?.args || [] }
 else { sock = args[0]; m = args[1]; a = args[2] || [] }

 const from = m.key.remoteJid
 const number = clean(a[0] || '')

 if(!number){
   return await sock.sendMessage(from,{text:`ㅤ ロ⃝ ❀ \`Sub-Bots masters\`\nᗤᗤ *Conecta un Sub-bot usando codigo de 8 digitos*\n\nUso: ${config.prefix}code 5959xxxxxx`},{quoted:m})
 }

 await sock.sendMessage(from,{text:`⏳ Generando código para +${number}...`},{quoted:m})

 try{
   await createJadiBot(sock, m, number, null, false, {
     onCode: async (code) => {
       let texto = `ㅤ ロ⃝ ❀ \`Sub-Bots masters\` \nᗤᗤ *Conecta un Sub-bot usando codigo de 8 digitos*\n\n 🥷 *Pasos de vinculación*\n\n⚔️ 1️⃣*Abre WhatsApp en tu teléfono » Ve a Ajustes/Configuración*\n\n⚔️ 2️⃣ *Entra en Dispositivos vinculados* \n\n⚔️ 3️⃣ *Pulsa Vincular un dispositivo y Selecciona Vincular con número de teléfono*\n\n⚔️ 4️⃣ *Pega el código que te dió el bot hay.*\n\n> Este código expira en 60 segundos`

       await sock.sendMessage(from,{text: texto},{quoted:m})
       await sock.sendMessage(from,{text: `\`${code}\``},{quoted:m})
     },
     onConnected: async (subSock) => {
       await sock.sendMessage(from,{text:`✅ *SubBot Conectado* +${number}`},{quoted:m})
     },
     onError: async (err) => {
       await sock.sendMessage(from,{text:`❌ ${err}`},{quoted:m})
     },
     onClose: async (reason) => {
       await sock.sendMessage(from,{text:`⚠️ Cerrado: ${reason}`},{quoted:m})
     }
   })
 }catch(e){
   await sock.sendMessage(from,{text:`❌ ${e.message}`},{quoted:m})
 }
}
