import axios from 'axios'

const typeEmoji = {
 normal: '⚪', fire: '🔥', water: '💧', grass: '🌿', electric: '⚡',
 ice: '❄️', fighting: '🥊', poison: '☠️', ground: '🌍', flying: '🕊️',
 psychic: '🔮', bug: '🐛', rock: '🪨', ghost: '👻', dragon: '🐉',
 dark: '🌑', steel: '⚙️', fairy: '🧚'
}

const getEmojiTypes = (typesStr) => {
 return typesStr.split(' / ').map(t => `${typeEmoji[t] || '🔹'} ${t}`).join(' ')
}

export const handler = {}
handler.name = 'pokedex'
handler.alias = ['dex', 'coleccion', 'misokes', 'mypokes']
handler.category = 'pokemon'
handler.description = 'Mira tu Pokédex con emojis'

handler.exec = async (sock, m, args, extra) => {
 const chatId = m.key.remoteJid
 const userId = m.key.participant || m.key.remoteJid
 const usedPrefix = extra?.usedPrefix || '.'
 let db = global.db?.data || {}
 if (!db.chat_users?.[chatId]?.[userId]) {
 return sock.sendMessage(chatId, { text: `❌ No tienes pokémones aún\nUsa *${usedPrefix}pokemon* para invocar uno` }, { quoted: m })
 }

 const user = db.chat_users[chatId][userId]
 if (!user.pokes || user.pokes.length === 0) {
 return sock.sendMessage(chatId, { text: `📭 Tu Pokédex está vacía` }, { quoted: m })
 }

 if (args[0]) {
 const q = args[0].toLowerCase()
 const found = user.pokes.find(p => p.name.toLowerCase() === q || String(p.id) === q)
 if (!found) return sock.sendMessage(chatId, { text: `❌ No tienes a *${q}* en tu dex` }, { quoted: m })

 let txt = `*╭─「 📖 POKÉDEX 」─*\n`
 txt += `*│* 🆔 *#${found.id}*\n`
 txt += `*│* ✨ *${found.name}*\n`
 txt += `*│* ${getEmojiTypes(found.types || 'normal')}\n`
 txt += `*│* 💰 Valor » *${found.value.toLocaleString()}*\n`
 txt += `*│* ${found.isLeg? '🌟 Legendario\n' : ''}${found.isMyth? '💫 Mítico\n' : ''}`
 txt += `*╰────────────*`
 return sock.sendMessage(chatId, { image: { url: found.sprite }, caption: txt }, { quoted: m })
 }

 let totalValue = 0
 let leg = 0
 let myth = 0
 let text = `*╭─「 📖 TU POKÉDEX 」─*\n`
 text += `*│* 👤 Usuario: @${userId.split('@')[0]}\n`
 text += `*│* 📦 Total: *${user.pokes.length}* pokémones\n`
 text += `*│*\n`

 const sorted = [...user.pokes].sort((a,b) => b.value - a.value).slice(0, 20)

 for (let p of sorted) {
 totalValue += p.value
 if (p.isLeg) leg++
 if (p.isMyth) myth++
 const e = (p.types || '').split(' / ')[0]
 const emoji = typeEmoji[e] || '🔹'
 const rare = p.isLeg? '🌟' : p.isMyth? '💫' : emoji
 text += `*│* ${rare} #${p.id} ${p.name} » ${p.value}\n`
 }

 if (user.pokes.length > 20) text += `*│*...y ${user.pokes.length - 20} más\n`
 text += `*│*\n`
 text += `*│* 💰 Valor total » *${totalValue.toLocaleString()}*\n`
 text += `*│* 🌟 Leg: ${leg} | 💫 Míticos: ${myth}\n`
 text += `*╰────────────*\n\n`
 text += `> Usa *${usedPrefix}dex <nombre>* para ver uno\n> Ej: *${usedPrefix}dex charizard*`

 await sock.sendMessage(chatId, { text, mentions: [userId] }, { quoted: m })
}
