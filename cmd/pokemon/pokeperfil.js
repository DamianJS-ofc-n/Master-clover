import { loadDB, senderCanon, learnLid, getUser } from '../../lib/poke.js'
export const handler = {}
handler.name = 'pokeperfil'
handler.alias = ['perfil poke', 'miperfil']
handler.category = 'pokemon'
handler.exec = async (sock, m, args) => {
 learnLid(m)
 const jid = m.key.remoteJid
 const me = senderCanon(m)
 const db = loadDB()
 const user = getUser(db, me)
 let totalValor = user.pokes.reduce((a,p)=>a+p.valor,0)
 let mejor = user.pokes.length ? [...user.pokes].sort((a,b)=>b.valor-a.valor)[0] : null
 let txt = `> 👤 *TU POKEPERFIL*\n> *📦 Pokes:* ${user.pokes.length}\n> *💰 PokeCoins:* ${user.pokeCoins}\n> *💎 Valor total:* ${totalValor}\n> *🏆 Victorias:* ${user.wins} | *💀 Derrotas:* ${user.losses}\n> *⭐ Mejor poke:* ${mejor ? `${mejor.name} (${mejor.rare}) - ${mejor.valor}` : 'Ninguno'}\n> *🎒 Balls:* Pokeball ${user.balls.pokeball} | Super ${user.balls.superball} | Ultra ${user.balls.ultraball} | Master ${user.balls.masterball}\n> *👥 Equipo:* ${user.equipo?.length ? user.equipo.map(i=>user.pokes[i]?.name).join(', ') : 'Sin equipo, armalo con .pokequipo'}`
 await sock.sendMessage(jid, {text: txt}, {quoted:m})
}
export default handler
