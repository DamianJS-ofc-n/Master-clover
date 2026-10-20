import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import config from '../../config.js'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../../')
const DB_TIENDA = path.join(ROOT, 'rpgper.json')
const clean = (s='') => String(s).replace(/[^0-9]/g,'')
const isOwnerCheck = (num) => config.bot.owner.some(o => clean(o) === clean(num) || String(o).includes(clean(num)))
function load(){ try{ if(!fs.existsSync(DB_TIENDA)) return {personajes:[]}; let j=JSON.parse(fs.readFileSync(DB_TIENDA,'utf8')); if(Array.isArray(j)) return {personajes:j}; return j }catch{ return {personajes:[]} } }
function norm(s){ return String(s).toLowerCase().replace(/[^a-z0-9]/g,'') }
export const handler={}
handler.name='addper2'
handler.alias=['addpj2','addper']
handler.category='RPG'
handler.exec=async(sock,m,a)=>{
  const chatId=m.key.remoteJid
  const sender=m.key.participant||m.key.remoteJid
  if(!isOwnerCheck(sender) && !m.key.fromMe) return sock.sendMessage(chatId,{text:"🚫 Solo owner"},{quoted:m})
  const full=(Array.isArray(a)?a.join(" "):"")+" "+(m.message?.extendedTextMessage?.text||"")
  const re=/🔥addper\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\d+)/g
  let match, data=load(), add=0
  while((match=re.exec(full))!==null){
    const [,nombre,hab1,hab2,imagen,precio]=match
    if(data.personajes.some(p=>norm(p.nombre)===norm(nombre))) continue
    data.personajes.push({ nombre, imagen, precio:parseInt(precio), nivel:1, habilidades:[{nombre:hab1,nivel:1},{nombre:hab2,nivel:1}] })
    add++
  }
  if(add===0) return sock.sendMessage(chatId,{text:"✳️ Usa: .addper2 🔥addper Nombre Hab1 Hab2 https://img.jpg 90000\nPuedes poner varios en un mensaje."},{quoted:m})
  fs.writeFileSync(DB_TIENDA, JSON.stringify(data,null,2))
  await sock.sendMessage(chatId,{text:`✅ Se agregaron ${add} personajes a rpgper.json\n📁 Total: ${data.personajes.length}`},{quoted:m})
}