export const handler = {}
handler.name = 'fuente'
handler.alias = ['font','fonts','letras','style','catalog']
handler.category = 'general'
handler.description = 'Convierte texto a estilos'

function gen(upperA, lowerA, digit0 = null) {
 const map = {}
 for(let i=0;i<26;i++){
 map[String.fromCharCode(97+i)] = String.fromCodePoint(lowerA + i)
 map[String.fromCharCode(65+i)] = String.fromCodePoint(upperA + i)
 }
 if(digit0 !== null){
 for(let i=0;i<10;i++) map[String(i)] = String.fromCodePoint(digit0 + i)
 }
 return map
}

export const fuentes = {
 gotica: { map: gen(0x1D504, 0x1D51E) },
 negrita: { map: gen(0x1D400, 0x1D41A, 0x1D7CE) },
 cursiva: { map: gen(0x1D434, 0x1D44E) },
 negrita_cursiva: { map: gen(0x1D468, 0x1D482) },
 mono: { map: gen(0x1D670, 0x1D68A, 0x1D7F6) },
 doble: { map: gen(0x1D538, 0x1D552, 0x1D7D8) },
 antigua: { map: gen(0x1D56C, 0x1D586) },
 ancha: { map: gen(0xFF21, 0xFF41) },
 negrita2: { map: gen(0x1D5A0, 0x1D5BA, 0x1D7EC) },
 sans: { map: gen(0x1D5A0, 0x1D5BA) },
 sans_bold: { map: gen(0x1D5D4, 0x1D5EE, 0x1D7EC) },
 sans_italic: { map: gen(0x1D608, 0x1D622) },
 sans_bold_italic: { map: gen(0x1D63C, 0x1D656) },
 script: { map: gen(0x1D49C, 0x1D4B6) },
 script_bold: { map: gen(0x1D4D0, 0x1D4EA) },
 serif_bold_italic: { map: gen(0x1D49C, 0x1D4B6) },
 cuadros: { map: { a:'🄰',b:'🄱',c:'🄲',d:'🄳',e:'🄴',f:'🄵',g:'🄶',h:'🄷',i:'🄸',j:'🄹',k:'🄺',l:'🄻',m:'🄼',n:'🄽',o:'🄾',p:'🄿',q:'🅀',r:'🅁',s:'🅂',t:'🅃',u:'🅄',v:'🅅',w:'🅆',x:'🅇',y:'🅈',z:'🅉' } },
 burbuja: { map: { a:'ⓐ',b:'ⓑ',c:'ⓒ',d:'ⓓ',e:'ⓔ',f:'ⓕ',g:'ⓖ',h:'ⓗ',i:'ⓘ',j:'ⓙ',k:'ⓚ',l:'ⓛ',m:'ⓜ',n:'ⓝ',o:'ⓞ',p:'ⓟ',q:'ⓠ',r:'ⓡ',s:'ⓢ',t:'ⓣ',u:'ⓤ',v:'ⓥ',w:'ⓦ',x:'ⓧ',y:'ⓨ',z:'ⓩ' } },
 circulos: { map: { a:'🅐',b:'🅑',c:'🅒',d:'🅓',e:'🅔',f:'🅕',g:'🅖',h:'🅗',i:'🅘',j:'🅙',k:'🅚',l:'🅛',m:'🅜',n:'🅝',o:'🅞',p:'🅟',q:'🅠',r:'🅡',s:'🅢',t:'🅣',u:'🅤',v:'🅥',w:'🅦',x:'🅧',y:'🅨',z:'🅩' } },
 mini: { map: { a:'ᵃ',b:'ᵇ',c:'ᶜ',d:'ᵈ',e:'ᵉ',f:'ᶠ',g:'ᵍ',h:'ʰ',i:'ⁱ',j:'ʲ',k:'ᵏ',l:'ˡ',m:'ᵐ',n:'ⁿ',o:'ᵒ',p:'ᵖ',q:'ᵠ',r:'ʳ',s:'ˢ',t:'ᵗ',u:'ᵘ',v:'ᵛ',w:'ʷ',x:'ˣ',y:'ʸ',z:'ᶻ' } },
 banderas: { map: { a:'🇦',b:'🇧',c:'🇨',d:'🇩',e:'🇪',f:'🇫',g:'🇬',h:'🇭',i:'🇮',j:'🇯',k:'🇰',l:'🇱',m:'🇲',n:'🇳',o:'🇴',p:'🇵',q:'🇶',r:'🇷',s:'🇸',t:'🇹',u:'🇺',v:'🇻',w:'🇼',x:'🇽',y:'🇾',z:'🇿' } },
 mayusculas: { map: { a:'ᴀ',b:'ʙ',c:'ᴄ',d:'ᴅ',e:'ᴇ',f:'ғ',g:'ɢ',h:'ʜ',i:'ɪ',j:'ᴊ',k:'ᴋ',l:'ʟ',m:'ᴍ',n:'ɴ',o:'ᴏ',p:'ᴘ',q:'ǫ',r:'ʀ',s:'s',t:'ᴛ',u:'ᴜ',v:'ᴠ',w:'ᴡ',x:'x',y:'ʏ',z:'ᴢ' } },
 tachado: { style: 'tachado' },
 tachado2: { style: 'tachado2' },
 subrayado: { style: 'subrayado' },
 slash: { style: 'slash' },
 corazones: { map: { a:'a♥',b:'b♥',c:'c♥',d:'d♥',e:'e♥',f:'f♥',g:'g♥',h:'h♥',i:'i♥',j:'j♥',k:'k♥',l:'l♥',m:'m♥',n:'n♥',o:'o♥',p:'p♥',q:'q♥',r:'r♥',s:'s♥',t:'t♥',u:'u♥',v:'v♥',w:'w♥',x:'x♥',y:'y♥',z:'z♥' } },
 flechas: { map: { a:'a➳',b:'b➳',c:'c➳',d:'d➳',e:'e➳',f:'f➳',g:'g➳',h:'h➳',i:'i➳',j:'j➳',k:'k➳',l:'l➳',m:'m➳',n:'n➳',o:'o➳',p:'p➳',q:'q➳',r:'r➳',s:'s➳',t:'t➳',u:'u➳',v:'v➳',w:'w➳',x:'x➳',y:'y➳',z:'z➳' } },
 invertida: { map: { a:'ɐ',b:'q',c:'ɔ',d:'p',e:'ǝ',f:'ɟ',g:'ƃ',h:'ɥ',i:'ᴉ',j:'ɾ',k:'ʞ',l:'ʅ',m:'ɯ',n:'u',o:'o',p:'d',q:'b',r:'ɹ',s:'s',t:'ʇ',u:'n',v:'ʌ',w:'ʍ',x:'x',y:'ʎ',z:'z' } },
 vaporwave: { style: 'vaporwave' }
}

function convertir(texto, tipo){
 const f = fuentes[tipo]
 if(!f) return null
 if(f.style){
 if(f.style === 'tachado') return texto.split('').map(c=>c+'̶').join('')
 if(f.style === 'tachado2') return texto.split('').map(c=>c+'̷').join('')
 if(f.style === 'subrayado') return texto.split('').map(c=>c+'̲').join('')
 if(f.style === 'slash') return texto.split('').map(c=>c+'̸').join('')
 if(f.style === 'vaporwave') return texto.split('').map(c=>c===' '?' ':String.fromCharCode(c.charCodeAt(0)+0xFEE0)).join('')
 }
 let t = texto
 if(tipo === 'invertida') t = t.split('').reverse().join('')
 return t.split('').map(c=>{
 return f.map[c] || f.map[c.toLowerCase()] || c
 }).join(tipo==='banderas'?' ':tipo==='corazones'||tipo==='flechas'?'': '')
}

handler.exec = async (sock, m) => {
 const from = m.key.remoteJid
 const body = m.message?.conversation || m.message?.extendedTextMessage?.text || ''
 const args = body.trim().split(/ +/)
 const sub = args[1]?.toLowerCase()
 const texto = args.slice(2).join(' ')
 const lista = Object.keys(fuentes).join(', ')

 if(!sub || sub==='lista' || sub==='list'){
 let txt=`╭─ *CAT - FUENTES (${Object.keys(fuentes).length})* ─╮\n│ .cat [estilo] [texto]\n╰─────────────\n\n`
 for(const k of Object.keys(fuentes)) txt+=`✧ ${k} → ${convertir(k,k)}\n`
 txt+=`\nEj: .cat script_bold Hola bro`
 return await sock.sendMessage(from,{text:txt},{quoted:m})
 }

 if(!fuentes[sub]){
 return await sock.sendMessage(from,{
 text:`《✧》La fuente *${sub}* no existe\n> ★ disponibles » ${lista}`
 },{quoted:m})
 }

 if(!texto){
 return await sock.sendMessage(from,{text:`✧ Pon un texto\nEj: .cat ${sub} Hola`},{quoted:m})
 }

 const res = convertir(texto, sub)
 await sock.sendMessage(from,{text:`*${sub.toUpperCase()}*\n\n${res}`},{quoted:m})
}
