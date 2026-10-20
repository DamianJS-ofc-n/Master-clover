import fs from 'fs/promises'
import config from '../../config.js'

const charactersFilePath = './core/characters.json'
async function loadCharacters() {
 const data = await fs.readFile(charactersFilePath, 'utf-8')
 return JSON.parse(data)
}
function flattenCharacters(structure) {
 return Object.values(structure).flatMap(s => Array.isArray(s.characters)? s.characters : [])
}
function getSeriesNameByCharacter(structure, characterId) {
 return Object.values(structure).find(s => Array.isArray(s.characters) && s.characters.some(c => String(c.id) === String(characterId)))?.name || 'Desconocido'
}

export const handler = {}
handler.name = 'vote'
handler.alias = ['votar']
handler.category = 'gacha'
handler.description = 'Votar por un personaje'

handler.exec = async (sock, m, args, extra) => {
 const chatId = m.key.remoteJid
 const sender = m.key.participant || m.key.remoteJid
 const usedPrefix = extra?.usedPrefix || '.'

 let db = global.db?.data || {}
 if (!db.chats) db.chats = {}
 if (!db.chats[chatId]) db.chats[chatId] = {}
 let chat = db.chats[chatId]
 if (chat.adminonly || chat.gacha === false) {
 return sock.sendMessage(chatId, { text: `ꕥ Los comandos de *Gacha* están desactivados.` }, { quoted: m })
 }

 if (!db.users) db.users = {}
 if (!db.users[sender]) db.users[sender] = {}
 let user = db.users[sender]
 const now = Date.now()
 const cooldown = 1 * 60 * 60 * 1000
 if (user.lastVote && now < user.lastVote) {
 const timeLeft = Math.ceil((user.lastVote - now) / 1000)
 const hours = Math.floor(timeLeft / 3600)
 const minutes = Math.floor((timeLeft % 3600) / 60)
 const seconds = timeLeft % 60
 let timeText = ''
 if (hours > 0) timeText += `${hours} hora${hours!== 1? 's' : ''} `
 if (minutes > 0) timeText += `${minutes} minuto${minutes!== 1? 's' : ''} `
 if (seconds > 0 || timeText === '') timeText += `${seconds} segundo${seconds!== 1? 's' : ''}`
 return sock.sendMessage(chatId, { text: `ꕥ Debes esperar *${timeText.trim()}* para usar *vote* de nuevo.` }, { quoted: m })
 }

 const inputArgs = args.args || args
 const name = inputArgs.join(' ').trim()
 if (!name) return sock.sendMessage(chatId, { text: '❀ Debes especificar un personaje para votarlo.' }, { quoted: m })

 const structure = await loadCharacters()
 const allCharacters = flattenCharacters(structure)
 const character = allCharacters.find(c => c.name.toLowerCase() === name.toLowerCase())
 if (!character) return sock.sendMessage(chatId, { text: `ꕥ Personaje no encontrado.` }, { quoted: m })

 if (!db.characters) db.characters = {}
 let characterData = db.characters[character.id]
 if (!characterData) characterData = { name: character.name, value: Number(character.value || 0), votes: 0, dailyIncrement: {} }
 if (!characterData.dailyIncrement) characterData.dailyIncrement = {}

 if (characterData.lastVotedAt && now < characterData.lastVotedAt + cooldown) {
 const remaining = characterData.lastVotedAt + cooldown - now
 const totalSec = Math.ceil(remaining / 1000)
 const h = Math.floor(totalSec / 3600)
 const m_ = Math.floor((totalSec % 3600) / 60)
 const s = totalSec % 60
 let timeText = ''
 if (h > 0) timeText += `${h} hora${h!== 1? 's' : ''} `
 if (m_ > 0) timeText += `${m_} minuto${m_!== 1? 's' : ''} `
 if (s > 0 || timeText === '') timeText += `${s} segundo${s!== 1? 's' : ''}`
 return sock.sendMessage(chatId, { text: `ꕥ *${characterData.name}* ha sido votada recientemente.\n> Debes esperar *${timeText.trim()}*` }, { quoted: m })
 }

 const today = new Date().toISOString().slice(0, 10)
 const currentValue = characterData.dailyIncrement[today] || 0
 if (currentValue >= 900) return sock.sendMessage(chatId, { text: `ꕥ *${characterData.name}* ya tiene el valor máximo hoy.` }, { quoted: m })

 const increment = Math.min(900 - currentValue, Math.floor(Math.random() * 201) + 50)
 characterData.value = (characterData.value || 0) + increment
 characterData.votes = (characterData.votes || 0) + 1
 characterData.lastVotedAt = now
 characterData.dailyIncrement[today] = currentValue + increment

 db.characters[character.id] = characterData
 user.lastVote = now + cooldown
 extra?.saveDB?.(); global.saveDB?.()

 const source = getSeriesNameByCharacter(structure, character.id)
 await sock.sendMessage(chatId, { text: `❀ Votaste por *${characterData.name}* (*${source}*)\n> Su nuevo valor es *${characterData.value.toLocaleString()}*` }, { quoted: m })
}
