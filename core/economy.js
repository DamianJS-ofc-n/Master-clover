import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'

let config = null
for(const p of [path.join(process.cwd(),'config.js'), path.resolve('./config.js')]){
 if(fs.existsSync(p)){
 try{ const mod = await import(pathToFileURL(p).href); config = mod.default||mod; break }catch{}
 }
}
if(!config) config = { economy: { coin: "Coins 🌠", symbol: "¥", bank: "Bank" } }

export const COIN = config.economy?.coin || "Coins 🌠"
export const SYMBOL = config.economy?.symbol || "¥"
export const BANK_NAME = config.economy?.bank || "Bank"

export function formatMoney(n){ return `${SYMBOL}${Number(n).toLocaleString()}` }
export function comicBox(text){ return text }

export function ensureDB(who){
 if(!global.db) global.db = { data: { users: {} } }
 if(!global.db.data) global.db.data = { users: {} }
 if(!global.db.data.users) global.db.data.users = {}
 if(!global.db.data.users[who]) global.db.data.users[who] = {}
 let u = global.db.data.users[who]
 if(!u.economy) u.economy = {
 name: who.split('@')[0], registered: false, money: 0, bank: 0, level: 1, exp: 0, fuerza: 10, defensa: 5,
 inv: { madera:0, piedra:0, pez:0, carne:0, mineral:0, huevo:0, hierro:0 },
 gallinas: 0, misiones: { pesca:0, mina:0 }, cooldowns: {},
 // PERFIL
 hobby: null,
 birthday: null,
 genero: null,
 casado: null,
 propuesta: null,
 hijos: 0,
 harem: [],
 casadoDesde: null
 }
 // migración si ya existía
 if(u.economy.hobby === undefined) u.economy.hobby = null
 if(u.economy.birthday === undefined) u.economy.birthday = null
 if(u.economy.genero === undefined) u.economy.genero = null
 if(u.economy.casado === undefined) u.economy.casado = null
 if(u.economy.propuesta === undefined) u.economy.propuesta = null
 if(u.economy.hijos === undefined) u.economy.hijos = 0
 if(u.economy.harem === undefined) u.economy.harem = []
 if(u.economy.casadoDesde === undefined) u.economy.casadoDesde = null

 return u.economy
}
export function isRegistered(who){ try{ return !!global.db.data.users[who]?.economy?.registered }catch{ return false } }
export function canUse(who, cmd, ms){ let e=ensureDB(who); let last=e.cooldowns[cmd]||0; let now=Date.now(); if(now-last<ms) return {ok:false,left:ms-(now-last)}; return {ok:true} }
export function setCooldown(who, cmd){ ensureDB(who).cooldowns[cmd]=Date.now() }
export function addMoney(who, amount, withExp=true){
 let e=ensureDB(who); e.money+=amount;
 if(withExp){ e.exp+=amount; while(e.exp>=1000){ e.exp-=1000; e.level++; e.fuerza+=2 } }
 return e
}
export function formatTime(ms){ let s=Math.ceil(ms/1000); if(s<60) return `${s}s`; let m=Math.floor(s/60), r=s%60; if(m<60) return `${m}m ${r}s`; let h=Math.floor(m/60); m%=60; return `${h}h ${m}m` }
export function getRango(lv){ if(lv<5) return 'Novato 🌱'; if(lv<10) return 'Aventurero ⚔️'; if(lv<20) return 'Guerrero 🔥'; if(lv<35) return 'Maestro 💎'; if(lv<50) return 'Leyenda 🌠'; return 'Dios 👑' }
