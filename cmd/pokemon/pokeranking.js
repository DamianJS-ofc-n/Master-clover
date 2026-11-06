import { loadDB, learnLid } from '../../lib/poke.js'
export const handler = {}
handler.name = 'pokeranking'
handler.alias = ['poketop', 'top poke', 'ranking poke']
handler.category = 'pokemon'
handler.exec = async (sock, m, args) => {
 learnLid(m)
 const jid = m.key.remoteJid
 const db = loadDB()
 let users = Object.entries(db.users).map(([id,u])=>({id, ...u, totalValor: u.pokes.reduce((a,p)=>a+p.valor,0)}))
 if(!users.length) return sock.sendMessage(jid, {text:'❌ Nadie tiene pokes todavía'}, {quoted:m})
 // .pokeranking coins / pokes / wins
 let tipo = (args[0]||'pokes').toLowerCase()
 if(tipo==='coins' || tipo==='coin') users.sort((a,b)=>b.pokeCoins-a.pokeCoins)
 else if(tipo==='wins' || tipo==='win') users.sort((a,b)=>b.wins-a.wins)
 else if(tipo==='valor') users.sort((a,b)=>b.totalValor-a.totalValor)
 else users.sort((a,b)=>b.pokes.length-a.pokes.length)
 let top = users.slice(0,10).map((u,i)=>{
 let medalla = ['🥇','🥈','🥉'][i] || `${i+1}.`
 let val = tipo==='coins' ? `${u.pokeCoins} PokeCoins` : tipo==='wins' ? `${u.wins}W` : tipo==='valor' ? `${u.totalValor} valor` : `${u.pokes.length} pokes`
 return `${medalla} @${u.id} - ${val}`
 }).join('\n')
 await sock.sendMessage(jid, {text:`🏆 *POKERANKING - ${tipo.toUpperCase()}*\n\n${top}\n\nUsá: *.pokeranking coins* / *.pokeranking wins* / *.pokeranking valor*`, mentions: users.slice(0,10).map(u=>u.id+'@s.whatsapp.net')}, {quoted:m})
}
export default handler
