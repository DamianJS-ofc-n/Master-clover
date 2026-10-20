import fs from 'fs'
const DB_PATH = './lib/akinator_db.json'

const PREGUNTAS = [
 { id: 'real', text: '¿Existe en la vida real?' },
 { id: 'mujer', text: '¿Es mujer?' },
 { id: 'vivo', text: '¿Está vivo?' },
 { id: 'famoso', text: '¿Es muy famoso?' },
 { id: 'internet', text: '¿Es famoso por internet?' },
 { id: 'deporte', text: '¿Es deportista?' },
 { id: 'musica', text: '¿Es cantante?' },
 { id: 'anime', text: '¿Es de anime/videojuego?' },
 { id: 'ficticio', text: '¿Es ficticio?' },
 { id: 'latino', text: '¿Es latino?' },
 { id: 'joven', text: '¿Tiene menos de 30?' },
]

function loadDB(){ try{return JSON.parse(fs.readFileSync(DB_PATH,'utf8'))}catch{return []} }
function saveDB(db){ fs.writeFileSync(DB_PATH, JSON.stringify(db,null,2)) }

export const handler = {}
handler.name = 'akinator'
handler.alias = ['aki']
handler.category = 'Juegos'
if (!global.aki) global.aki = new Map()

handler.exec = async (sock, m, args) => {
 let jid = m.key.remoteJid
 let sender = m.key.participant || m.key.remoteJid || jid
 let id = `${jid}-${sender}`
 let input = args.join(' ').toLowerCase().trim()
 let ses = global.aki.get(id)

 // SI NO ESTA JUGANDO -> INICIAR
 if (!ses) {
 global.aki.set(id, { index: 0, respuestas: {}, perfil: [], esperandoNombre: false, finalizado: false })
 return sock.sendMessage(jid, { 
 text: `🔮 *Akinator Local* [${loadDB().length} personajes]\n\n*Pregunta 1/${PREGUNTAS.length}:* ${PREGUNTAS[0].text}\n\nResponde:\n*.aki si* | *.aki no* | *.aki nose*\nTambién: *.aki 1* / *.aki 2* / *.aki 0*` 
 }, { quoted: m })
 }

 // SI ESTA ENSEÑANDO NOMBRE
 if (ses.esperandoNombre) {
 if (!input || ['si','no','1','2','0','nose'].includes(input)) return sock.sendMessage(jid, { text: `Escribí el nombre del personaje para aprenderlo.\nEj: *.aki El Mariana*` }, { quoted: m })
 let db = loadDB()
 db.push({ name: args.join(' ').trim(), desc: 'Aprendido', tags: ses.perfil })
 saveDB(db)
 global.aki.delete(id)
 return sock.sendMessage(jid, { text: `✅ Aprendido *${args.join(' ').trim()}* con tags: ${ses.perfil.join(', ')}\n\n*.aki* para jugar de nuevo.` }, { quoted: m })
 }

 // SI ESTA EN CONFIRMACION FINAL
 if (ses.finalizado) {
 if (['si','s','1','yes'].includes(input)) {
 global.aki.delete(id)
 return sock.sendMessage(jid, { text: `¡Gané! 🎉 *.aki* para otra ronda.` }, { quoted: m })
 }
 if (['no','n','2'].includes(input)) {
 ses.esperandoNombre = true
 ses.finalizado = false
 global.aki.set(id, ses)
 return sock.sendMessage(jid, { text: `¿Quien era entonces? Escribí: *.aki Nombre*` }, { quoted: m })
 }
 return sock.sendMessage(jid, { text: `¿Acerté? *.aki si* / *.aki no*` }, { quoted: m })
 }

 // SI ESTA RESPONDIENDO PREGUNTAS
 let valor = null
 if (['si','s','1','yes','sí'].includes(input)) valor = 1
 if (['no','n','2','nop'].includes(input)) valor = 0
 if (['nose','0','no se','ns','idk'].includes(input)) valor = -1

 if (valor === null) {
 return sock.sendMessage(jid, { text: `Responde *.aki si* / *.aki no* / *.aki nose*\nPregunta actual: ${PREGUNTAS[ses.index].text}` }, { quoted: m })
 }

 let pActual = PREGUNTAS[ses.index]
 if (valor === 1) ses.respuestas[pActual.id] = 1
 if (valor === 0) ses.respuestas[pActual.id] = 0
 ses.index++

 if (ses.index < PREGUNTAS.length) {
 return sock.sendMessage(jid, { text: `*Pregunta ${ses.index+1}/${PREGUNTAS.length}:* ${PREGUNTAS[ses.index].text}\n\n*.aki si* | *.aki no* | *.aki nose*` }, { quoted: m })
 }

 // ADIVINAR
 let tagsSi = Object.keys(ses.respuestas).filter(k => ses.respuestas[k] === 1)
 let tagsNo = Object.keys(ses.respuestas).filter(k => ses.respuestas[k] === 0)
 ses.perfil = tagsSi
 let db = loadDB()
 let cands = db.map(p => {
 let s = 0
 for (let t of tagsSi) if (p.tags.includes(t)) s += 2
 for (let t of tagsNo) if (p.tags.includes(t)) s -= 3
 return { ...p, score: s }
 }).sort((a,b) => b.score-a.score)

 if (cands[0]?.score >= 2) {
 ses.finalizado = true
 global.aki.set(id, ses)
 return sock.sendMessage(jid, { text: `🔮 Creo que es *${cands[0].name}* - ${cands[0].desc}\nScore: ${cands[0].score}\n\n¿Acerté? *.aki si* / *.aki no*` }, { quoted: m })
 } else {
 ses.esperandoNombre = true
 global.aki.set(id, ses)
 return sock.sendMessage(jid, { text: `😿 No lo tengo en mi base.\nTags: ${tagsSi.join(', ') || 'ninguno'}\n\n¿Quien era? Escribí: *.aki Nombre*` }, { quoted: m })
 }
}
