function toSmallCaps(str){
 const map = {a:'ᴀ',b:'ʙ',c:'ᴄ',d:'ᴅ',e:'ᴇ',f:'ғ',g:'ɢ',h:'ʜ',i:'ɪ',j:'ᴊ',k:'ᴋ',l:'ʟ',m:'ᴍ',n:'ɴ',o:'ᴏ',p:'ᴘ',q:'ǫ',r:'ʀ',s:'s',t:'ᴛ',u:'ᴜ',v:'ᴠ',w:'ᴡ',x:'x',y:'ʏ',z:'ᴢ'}
 return str.toLowerCase().split('').map(c=>map[c]||c).join('').toUpperCase()
}
function toFancy(str){
 // para RPG -> 𝐑𝐏𝐆
 return str.toUpperCase()
}

export const diseños = {
 normal: {
 name: 'normal',
 render: ({usermcn, botName, type, saludo, cmds, users, categories, prefix})=>{
 let bloques=''
 for(let [cat,list] of categories){
 let big = toFancy(cat)
 bloques+=`╭── ${big}\n${list.map(c=>`│๛ ${c.name}`).join('\n')}\n╰──────────────╯\n\n`
 }
 return `${usermcn}Bienvenido Soy ${botName} ${type} a mi menu Espero tengas una ${saludo}\n📦 Plugins ➤ ${cmds}\n👤 Usuarios ➤ ${users}\n▭▭▭▭▭▭▭▭\n THE LEGENCY EDITION\n▭▭▭▭▭▭\n\n${bloques}`.trim()
 }
 },
 pro: {
 name: 'pro',
 render: ({usermcn, botName, type, cmds, users, categories})=>{
 let bloques=''
 for(let [cat,list] of categories){
 bloques+=`╭─── ${cat}\n${list.map(c=>`│ 乂 ${c.name}`).join('\n')}\n╰──────────────\n\n`
 }
 return `乂 ${usermcn.trim()} 乂\n${botName} ${type}\n\nPlugins: ${cmds} \nUsuarios: ${users}\n\n━━━━━━━━ THE LEGENCY ━━━━━━━━\n\n${bloques}`.trim()
 }
 },
 galactico: {
 name: 'galactico',
 render: ({usermcn, botName, type, cmds, users, categories})=>{
 let bloques=''
 for(let [cat,list] of categories){
 bloques+=`╭─ 🎮 ${cat} - Galactic\n${list.map(c=>`│ 乂 ${c.name}`).join('\n')}\n╰──────\n\n`
 }
 return `╭━━━━━━━━━━━━━━━━━╮\n┃ ༺ 𝐓𝐇𝐄 𝐋𝐄𝐆𝐄𝐍𝐂𝐘 ༻ ┃\n┃ 𝙴𝙳𝙸𝚃𝙸𝙾𝙽 𝙶𝙰𝙻𝙰𝙲𝚃𝙸𝙲𝙰 ┃\n╰━━━━━━━━━━━━━━━━━╯\nBienvenido ${usermcn.trim()} a la nave de ${botName} ${type}\n乂 Plugins: ${cmds} | Usuarios: ${users}\n\n${bloques}`.trim()
 }
 },
 hallowen: {
 name: 'hallowen',
 render: ({cmds, users, categories})=>{
 let bloques=''
 for(let [cat,list] of categories){
 let big = toFancy(cat)
 bloques+=`┏━━━━━ ${big}\n${list.map(c=>` 🎃 ${c.name}`).join('\n')}\n┗━━━✦❘༻༺❘✦━━━┛\n\n`
 }
 return `◢◤◢◤✦ THE LEGENCY ✦◥◣◥◣\n ⚔️ *EDITION HALLOWEN*\n\n乂 Plugins: ${cmds} | Usuarios: ${users}\n\n${bloques}╭─━━━─━━━─━━━─╮\n│ 🕷️Feliz noche \n╰─━━━─━━━─━━━─╯`.trim()
 }
 },
 electro: {
 name: 'electro',
 render: ({usermcn, botName, type, cmds, users, categories})=>{
 let out = `█▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀█\n█ ${usermcn.trim()} █\n█ ${botName} ${type} █\n█▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄█\n\n█▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀█\n█ Plugins: ${cmds} █\n█ Usuarios: ${users} █\n█▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄█\n\n█▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀█\n█ THE LEGENCY EDITION █\n█▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄█\n\n`
 for(let [cat,list] of categories){
 out+=`█▀▀▀▀▀▀▀▀▀▀█\n█ ${cat}\n█▄▄▄▄▄▄▄▄▄▄█\n${list.map(c=>`█ ${c.name}`).join('\n')}\n█▄▄▄▄▄▄▄▄▄▄█\n\n`
 }
 return out.trim()
 }
 },
 simple: {
 name: 'simple',
 render: ({usermcn, botName, type, cmds, users, categories, prefix, uptime, level, exp})=>{
 let bloques=''
 for(let [cat,list] of categories){
 bloques+=`*${cat.toUpperCase()}* [${list.length}]\n${list.map(c=>`- ${prefix}${c.name}`).join('\n')}\n\n`
 }
 return `Hola ${usermcn.trim()}! Soy *${botName}*\n\nINFO BOT\n- Bot: ${botName}\n- Type: ${type}\n- Uptime: ${uptime}\n- Comandos: ${cmds}\n\nINFO USER\n- User: ${usermcn.trim()}\n- Level: ${level} | Exp: ${exp}\n\nCOMANDOS\n----------------------\n${bloques}------------------------------------------`.trim()
 }
 }
}

export function getDiseño(name){
 return diseños[name?.toLowerCase()] || diseños['normal']
}
