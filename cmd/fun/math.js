import config from '../../config.js'

global.math = global.math || {}

const limits = { facil: 10, medio: 50, dificil: 90, imposible: 100, imposible2: 160 }
const rewardRanges = { facil: [500, 1000], medio: [1000, 2000], dificil: [2000, 3500], imposible: [3500, 4800], imposible2: [5000, 6500] }

const generateRandomNumber = (max) => Math.floor(Math.random() * max) + 1
const getOperation = () => ['+', '-', '*', '/'][Math.floor(Math.random() * 4)]

const generarProblema = (dificultad) => {
 const maxLimit = limits[dificultad] || 30
 let num1 = generateRandomNumber(maxLimit)
 let num2 = generateRandomNumber(maxLimit)
 let operador = getOperation()
 if(operador === '/' ){
 num2 = generateRandomNumber(Math.max(2, Math.floor(maxLimit/5)))
 num1 = num2 * generateRandomNumber(10)
 }
 const resultado = eval(`${num1} ${operador} ${num2}`)
 const simbolo = operador === '*'? '×' : operador === '/'? '÷' : operador
 return { problema: `${num1} ${simbolo} ${num2}`, resultado }
}

export const handler = {}
handler.name = 'math'
handler.alias = ['mates']
handler.category = 'economy'
handler.description = 'Iniciar un juego de matemáticas.'
handler.before = true

handler.execBefore = async (sock, m, a, extra) => {
 const chatId = m.key.remoteJid
 const juego = global.math[chatId]
 if (!juego?.juegoActivo) return false

 const respuestaUsuario = parseFloat((m.message?.conversation || m.message?.extendedTextMessage?.text || '').trim())
 if (isNaN(respuestaUsuario)) return false

 let db = extra?.users || global?.db?.data?.users || {}
 let groupId = chatId.endsWith('@g.us')? chatId : 'global'
 let sender = m.key.participant || m.key.remoteJid
 if(!db[groupId]) db[groupId] = {}
 if(!db[groupId][sender]) db[groupId][sender] = { coins:0 }
 let user = db[groupId][sender]

 const respuestaCorrecta = parseFloat(juego.respuesta)
 if (Math.abs(respuestaUsuario - respuestaCorrecta) < 0.01) {
 const [min, max] = rewardRanges[juego.dificultad] || [500, 1000]
 const coinsAleatorio = Math.floor(Math.random() * (max - min + 1)) + min
 user.coins = (user.coins||0) + coinsAleatorio
 clearTimeout(juego.tiempoLimite)
 delete global.math[chatId]
 await sock.sendMessage(chatId, {
 text:`「❀」Respuesta correcta.\n> *Ganaste ›* ${config.economy?.symbol||'¥'}${coinsAleatorio.toLocaleString()}`,
 contextInfo:{ forwardingScore:999, isForwarded:true, forwardedNewsletterMessageInfo:{ newsletterJid:config.channels.id, newsletterName:config.channels.cname, serverMessageId:-1 } }
 },{quoted:m})
 extra?.saveDB?.(); global.saveDB?.()
 return true
 } else {
 juego.intentos += 1
 if (juego.intentos >= 3) {
 clearTimeout(juego.tiempoLimite)
 delete global.math[chatId]
 await sock.sendMessage(chatId, {
 text:'「✎」Te quedaste sin intentos. Suerte a la próxima.',
 contextInfo:{ forwardingScore:999, isForwarded:true, forwardedNewsletterMessageInfo:{ newsletterJid:config.channels.id, newsletterName:config.channels.cname, serverMessageId:-1 } }
 },{quoted:m})
 } else {
 await sock.sendMessage(chatId, {
 text:`「✎」Respuesta incorrecta, te quedan ${3 - juego.intentos} intentos.`,
 contextInfo:{ forwardingScore:999, isForwarded:true, forwardedNewsletterMessageInfo:{ newsletterJid:config.channels.id, newsletterName:config.channels.cname, serverMessageId:-1 } }
 },{quoted:m})
 }
 return true
 }
}

handler.exec = async (sock, m, a, extra) => {
 const chatId = m.key.remoteJid
 if (global.math[chatId]?.juegoActivo) {
 return sock.sendMessage(chatId, {
 text:'ꕥ Ya hay un juego activo. Espera a que termine.',
 contextInfo:{ forwardingScore:999, isForwarded:true, forwardedNewsletterMessageInfo:{ newsletterJid:config.channels.id, newsletterName:config.channels.cname, serverMessageId:-1 } }
 },{quoted:m})
 }

 let dificultad = (a.args?.[0] || a.text || '').toLowerCase()
 if (!limits[dificultad]) {
 return sock.sendMessage(chatId, {
 text:'「✎」Especifica una dificultad válida: *facil, medio, dificil, imposible, imposible2*',
 contextInfo:{ forwardingScore:999, isForwarded:true, forwardedNewsletterMessageInfo:{ newsletterJid:config.channels.id, newsletterName:config.channels.cname, serverMessageId:-1 } }
 },{quoted:m})
 }

 const { problema, resultado } = generarProblema(dificultad)
 const sent = await sock.sendMessage(chatId, {
 text:`「✩」Tienes 1 minuto para resolver:\n\n> ✩ *${problema}*\n\n_✐ Responde con el número correcto!_`,
 contextInfo:{ forwardingScore:999, isForwarded:true, forwardedNewsletterMessageInfo:{ newsletterJid:config.channels.id, newsletterName:config.channels.cname, serverMessageId:-1 } }
 },{quoted:m})

 global.math[chatId] = {
 juegoActivo: true,
 problema,
 respuesta: resultado.toString(),
 intentos: 0,
 dificultad,
 timeout: Date.now() + 60000,
 problemMessageId: sent?.key?.id,
 tiempoLimite: setTimeout(() => {
 if (global.math[chatId]?.juegoActivo) {
 delete global.math[chatId]
 sock.sendMessage(chatId, {
 text:`「✿」Tiempo agotado. La respuesta era *${resultado}*.`,
 contextInfo:{ forwardingScore:999, isForwarded:true, forwardedNewsletterMessageInfo:{ newsletterJid:config.channels.id, newsletterName:config.channels.cname, serverMessageId:-1 } }
 })
 }
 }, 60000)
 }
}
