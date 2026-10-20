import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { downloadContentFromMessage } from '@whiskeysockets/baileys'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../../')

export const handler = {}
handler.name = 'saveper'
handler.alias = ['savefilep','sfp','guardarper']
handler.category = 'owner'

handler.exec = async (sock,m,a)=>{
  const chatId=m.key.remoteJid
  const dest = (Array.isArray(a)?a.join(" "):"").trim() || "rpgper.json"
  const ctx = m.message?.extendedTextMessage?.contextInfo
  const q = ctx?.quotedMessage
  if(!q) return sock.sendMessage(chatId,{text:"❌ Responde al documento con .savefile rpgper.json"},{quoted:m})

  const doc = q.documentMessage || q.documentWithCaptionMessage?.message?.documentMessage
  const code = q.conversation || q.extendedTextMessage?.text

  try{
    const fullPath = path.isAbsolute(dest)?dest:path.join(ROOT,dest)
    fs.mkdirSync(path.dirname(fullPath),{recursive:true})

    if(doc){
      const stream = await downloadContentFromMessage(doc, 'document')
      let buffer = Buffer.from([])
      for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
      fs.writeFileSync(fullPath, buffer)
      await sock.sendMessage(chatId,{text:`✅ ARCHIVO GUARDADO\n📁 ${dest}\n📦 ${buffer.length} bytes\nAhora .tiendaper`},{quoted:m})
    }else if(code){
      fs.writeFileSync(fullPath, code, 'utf8')
      await sock.sendMessage(chatId,{text:`✅ CODIGO GUARDADO\n📁 ${dest}`},{quoted:m})
    }else{
      await sock.sendMessage(chatId,{text:`❌ No es doc. Es: ${Object.keys(q).join(", ")}`},{quoted:m})
    }
  }catch(e){
    console.error(e)
    await sock.sendMessage(chatId,{text:`❌ Error: ${e.message}`},{quoted:m})
  }
}