import fs from 'fs'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'db', 'pokemon.json')
const LIDMAP_PATH = path.join(process.cwd(), 'db', 'lidmap.json')
const SPAWN_PATH = path.join(process.cwd(), 'db', 'pokespawn.json')

function ensure(){
 if(!fs.existsSync(path.dirname(DB_PATH))) fs.mkdirSync(path.dirname(DB_PATH), {recursive:true})
 if(!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify({users:{}, spawns:{}}, null, 2))
 if(!fs.existsSync(LIDMAP_PATH)) fs.writeFileSync(LIDMAP_PATH, JSON.stringify({}, null, 2))
 if(!fs.existsSync(SPAWN_PATH)) fs.writeFileSync(SPAWN_PATH, JSON.stringify({}, null, 2))
}
export function loadDB(){ ensure(); try{ return JSON.parse(fs.readFileSync(DB_PATH,'utf8')) }catch{ return {users:{}, spawns:{}} } }
export function saveDB(db){ ensure(); fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2)) }
export function loadLidMap(){ ensure(); try{ return JSON.parse(fs.readFileSync(LIDMAP_PATH,'utf8')) }catch{ return {} } }
export function saveLidMap(m){ ensure(); fs.writeFileSync(LIDMAP_PATH, JSON.stringify(m, null, 2)) }

// ===== LID -> NUMERO REAL, SIN DUPLICAR =====
// m.key.participant = LID, m.key.participantPn = NUMERO REAL (si viene)
// Cuando alguien habla, aprendemos: lid -> pn
export function learnLid(m){
 if(!m?.key) return
 const lid = String(m.key.participant || '').replace(/\D/g,'')
 const pn = String(m.key.participantPn || m.key.participantAlt || '').replace(/\D/g,'')
 // tambien en remoteJidAlt
 const pn2 = String(m.key.remoteJidAlt || '').replace(/\D/g,'')
 const real = pn || pn2
 if(lid && real && lid !== real){
 const map = loadLidMap()
 if(map[lid] !== real){ map[lid] = real; saveLidMap(map) }
 // MIGRAR: si tenia pokes guardados con lid, pasarlos a pn y borrar lid
 const db = loadDB()
 if(db.users[lid] && !db.users[real]){
 db.users[real] = db.users[lid]
 delete db.users[lid]
 saveDB(db)
 } else if(db.users[lid] && db.users[real]){
 // fusionar, sin duplicar por id de pokemon
 let ids = new Set(db.users[real].pokes.map(p => p.uid))
 for(let p of db.users[lid].pokes) if(!ids.has(p.uid)) db.users[real].pokes.push(p)
 db.users[real].pokeCoins = (db.users[real].pokeCoins||0) + (db.users[lid].pokeCoins||0)
 db.users[real].balls = (db.users[real].balls||0) + (db.users[lid].balls||0)
 delete db.users[lid]
 saveDB(db)
 }
 }
}

// Devuelve SIEMPRE la key canonica: numero real si lo conocemos, si no el lid
export function canon(jidOrNum){
 if(!jidOrNum) return ''
 let n = String(jidOrNum).split('@')[0].split(':')[0].replace(/\D/g,'')
 if(!n) return ''
 const map = loadLidMap()
 // si es lid y conocemos su pn, usar pn
 if(map[n]) return map[n]
 // si es pn y tenemos lid que apunta a el, igual es pn, ya esta bien
 return n
}

// Quien mando el mensaje, con lid traducido
export function senderCanon(m){
 learnLid(m)
 const raw = m.key.participantPn || m.key.participant || m.key.remoteJid || ''
 return canon(raw)
}

// Menciones: WhatsApp manda lid en mentionedJid, lo traducimos con el mapa
export function mentionedCanon(m){
 const ctx = m.message?.extendedTextMessage?.contextInfo || m.message?.imageMessage?.contextInfo || m.message?.videoMessage?.contextInfo || {}
 let list = ctx.mentionedJid || []
 // en versiones nuevas tambien viene mentionedJidAlt? si viene, preferirlo
 // Baileys a veces pone el pn en participantPn del context, no hay, usamos mapa
 return list.map(j => canon(j)).filter(Boolean)
}
export function getQuotedCanon(m){
 const ctx = m.message?.extendedTextMessage?.contextInfo || {}
 if(!ctx.participant) return null
 // el quoted trae participant (lid) y a veces participantPn no, usamos mapa
 return canon(ctx.participant)
}

export function getUser(db, canonId){
 if(!db.users[canonId]) db.users[canonId] = { pokes: [], pokeCoins: 0, balls: { pokeball: 3, superball: 0, ultraball: 0, masterball: 0 }, wins: 0, losses: 0 }
 return db.users[canonId]
}

// ===== POKEAPI =====
const TIPOS_ES = { normal:'Normal', fire:'Fuego', water:'Agua', grass:'Planta', electric:'Eléctrico', ice:'Hielo', fighting:'Lucha', poison:'Veneno', ground:'Tierra', flying:'Volador', psychic:'Psíquico', bug:'Bicho', rock:'Roca', ghost:'Fantasma', dragon:'Dragón', dark:'Siniestro', steel:'Acero', fairy:'Hada' }

export async function fetchPokemon(idOrName){
 let id = idOrName
 if(!id) id = Math.floor(Math.random()*1025)+1
 const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
 if(!res.ok) throw new Error('PokeAPI fallo')
 const p = await res.json()
 let species = null
 try{ const r2 = await fetch(p.species.url); species = await r2.json() }catch{}
 const isLegend = species?.is_legendary || species?.is_mythical
 let rare = 'Común'
 if(isLegend) rare = 'Legendario'
 else if(p.base_experience >= 240) rare = 'Épico'
 else if(p.base_experience >= 170) rare = 'Raro'
 else if(p.base_experience >= 110) rare = 'Poco Común'
 let mult = { 'Común': 1, 'Poco Común': 1.5, 'Raro': 2.5, 'Épico': 5, 'Legendario': 10 }[rare]
 let valor = Math.round((p.base_experience || 60) * mult)
 let stats = {}
 for(let s of p.stats) stats[s.stat.name] = s.base_stat
 return {
 id: p.id,
 name: p.name.charAt(0).toUpperCase()+p.name.slice(1),
 nameRaw: p.name,
 peso: (p.weight/10).toFixed(1)+' kg',
 altura: (p.height/10).toFixed(1)+' m',
 tipo: p.types.map(t => TIPOS_ES[t.type.name] || t.type.name).join(' / '),
 tipoRaw: p.types.map(t => t.type.name),
 img: p.sprites.other?.['official-artwork']?.front_default || p.sprites.front_default,
 rare, valor,
 hp: stats.hp||50, atk: stats.attack||50, def: stats.defense||50, speed: stats.speed||50,
 baseExp: p.base_experience || 60
 }
}

export function ballBonus(ball){
 return { pokeball: 0.15, superball: 0.30, ultraball: 0.50, masterball: 1 }[ball] || 0.15
}
export function catchChance(poke, ball){
 // legendario mas dificil, masterball 100%
 if(ball === 'masterball') return 1
 let base = 0.55
 if(poke.rare === 'Legendario') base = 0.12
 else if(poke.rare === 'Épico') base = 0.25
 else if(poke.rare === 'Raro') base = 0.38
 else if(poke.rare === 'Poco Común') base = 0.48
 return Math.min(0.95, base + ballBonus(ball))
}
