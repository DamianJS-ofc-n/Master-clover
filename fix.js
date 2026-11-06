import fs from 'fs'
let t = fs.readFileSync('lib/jadi.js','utf8')

// --- FIX 1: integrity ya no borra ---
let a = t.indexOf("if (!fs.existsSync(credsPath))")
let b = t.indexOf("}, 1500)", a)
if (a === -1 || b === -1) console.log('FIX1 no encontrado')
else {
 let nuevo = `if (!fs.existsSync(credsPath)) {
 console.log('[SUBBOT] creds.json no existe, NO borro sesion')
 persistCreds()
 }`
 t = t.slice(0, a) + nuevo + t.slice(b + 7)
 console.log('FIX1 OK')
}

// --- FIX 2: 440 ya no muere, reconecta ---
let c = t.indexOf("if (statusCode === DisconnectReason.connectionReplaced")
let d = t.indexOf("reconectando.set", c)
if (c === -1 || d === -1) console.log('FIX2 no encontrado')
else {
 let nuevo2 = `if (statusCode === DisconnectReason.connectionReplaced || statusCode === 440) {
 console.log('[SUBBOT] 440, reconectando solo, NO borro sesion')
 }\n\n `
 t = t.slice(0, c) + nuevo2 + t.slice(d)
 console.log('FIX2 OK')
}

fs.writeFileSync('lib/jadi.js', t)
console.log('guardado')
