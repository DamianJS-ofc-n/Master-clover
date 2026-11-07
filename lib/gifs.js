import fs from 'fs'
import path from 'path'
import { loadMods, isOwner } from './mods.js'

const DIR = path.join(process.cwd(), 'core', 'dbreacciones')
const ultimoGif = new Map() // chatId:comando -> archivo, para no repetir

export function normalizarCmd(cmd){
 return (cmd||'').toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function isStaffOrOwner(m){
 if(isOwner(m)) return true
 try{
 let db = loadMods()
 let sender = m.key.participant || m.key.remoteJid
 let num = sender.split('@')[0].replace(/[^0-9]/g, '')
 if(db[num]?.rol === 'staff') return true
 if(db[sender]?.rol === 'staff') return true
 }catch{}
 return false
}

export function getCarpeta(cmd){
 return path.join(DIR, normalizarCmd(cmd))
}

export function listarGifs(cmd){
 cmd = normalizarCmd(cmd)
 let carpeta = getCarpeta(cmd)
 try{
 if(!fs.existsSync(carpeta)) return []
 return fs.readdirSync(carpeta).filter(f => /\.(mp4|gif|webp|mov)$/i.test(f)).sort()
 }catch{ return [] }
}

export function listarComandos(){
 try{
 if(!fs.existsSync(DIR)) return []
 return fs.readdirSync(DIR).filter(f => fs.statSync(path.join(DIR, f)).isDirectory())
 }catch{ return [] }
}

export function agregarGif(cmd, buffer, ext){
 cmd = normalizarCmd(cmd)
 if(!cmd) return null
 let carpeta = getCarpeta(cmd)
 fs.mkdirSync(carpeta, { recursive: true })
 let nombre = `${Date.now()}_${Math.floor(Math.random()*9999)}.${ext}`
 fs.writeFileSync(path.join(carpeta, nombre), buffer)
 return nombre
}

export function getGifRandom(cmd, chatId = ''){
 cmd = normalizarCmd(cmd)
 let lista = listarGifs(cmd)
 if(!lista.length) return null
 let key = `${chatId}:${cmd}`
 let ultimo = ultimoGif.get(key)
 let candidatos = lista.filter(f => f !== ultimo)
 if(!candidatos.length) candidatos = lista
 let file = candidatos[Math.floor(Math.random() * candidatos.length)]
 ultimoGif.set(key, file)
 let ruta = path.join(getCarpeta(cmd), file)
 if(!fs.existsSync(ruta)) return null
 return { file, ruta, buffer: fs.readFileSync(ruta), total: lista.length }
}

export function borrarGif(cmd, index){
 cmd = normalizarCmd(cmd)
 let lista = listarGifs(cmd)
 if(!lista[index]) return false
 let ruta = path.join(getCarpeta(cmd), lista[index])
 try{ if(fs.existsSync(ruta)) fs.unlinkSync(ruta) }catch{}
 return true
}
