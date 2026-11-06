function toSmallCaps(str){
 const map = {a:'ᴀ',b:'ʙ',c:'ᴄ',d:'ᴅ',e:'ᴇ',f:'ғ',g:'ɢ',h:'ʜ',i:'ɪ',j:'ᴊ',k:'ᴋ',l:'ʟ',m:'ᴍ',n:'ɴ',o:'ᴏ',p:'ᴘ',q:'ǫ',r:'ʀ',s:'s',t:'ᴛ',u:'ᴜ',v:'ᴠ',w:'ᴡ',x:'x',y:'ʏ',z:'ᴢ'}
 return str.toLowerCase().split('').map(c=>map[c]||c).join('').toUpperCase()
}
function toFancy(str){
 return str.toUpperCase()
}

export const diseños = {
 normal: {
 name: 'normal',
 render: ({usermcn, botName, type, saludo, cmds, users, categories})=>{
 let bloques=''
 for(let [cat,list] of categories){
 let big = toFancy(cat)
 bloques+=`╭── ${big}\n${list.map(c=>`│๛ ${c.name}`).join('\n')}\n╰──────────────╯\n\n`
 }
 return `${usermcn} Bienvenido a mi menu de comandos Soy ${botName} ${type} Espero tengas una ${saludo}\n📦 Plugins ➤ ${cmds}\n👤 Usuarios ➤ ${users}\n▭▭▭▭▭▭▭▭\n THE LEGENCY EDITION\n▭▭▭▭▭▭\n\n${bloques}`.trim()
 }
 },
 pro: {
 name: 'pro',
 render: ({usermcn, botName, type, cmds, users, categories, prefix, uptime, hora, fecha})=>{
 let bloques=''
 for(let [cat,list] of categories){
 bloques+=`> ╭━━❑ *${toSmallCaps(cat)}* ❑\n${list.map(c=>`> | ◈ ${c.name}`).join('\n')}\n> ╰━━❏\n`
 }
 return `╭─◈ *ʟᴏᴄᴏꜱ • ʏ • ᴀꜱᴏᴄɪᴀᴅᴏꜱ • ʟʏᴀ*\n> ╭━━❑ *sᴛᴀᴛᴜs* ❑\n> | *ᴜsᴇʀ* : ${usermcn.trim()}\n> | *ᴛɪᴘᴏ* : ${type}\n> | *ʙᴏᴛ* : ${botName}\n> | *ᴄᴏᴍᴀɴᴅᴏꜱ* : ${cmds}\n> | *ᴍᴏᴅᴏ* : 🔓 \n> | *ᴅᴇᴠᴇʟᴏᴘᴇʀ* : ᴅᴀᴍɪᴀɴ.ᴊꜱ\n> | *ᴜᴘᴛɪᴍᴇ* : ${uptime || 'online'}\n> | *ʜᴏʀᴀ* : ${hora || ''}\n> ╰━━❏\n${bloques}╰─◈ _— \`ᴛᴏᴛᴀʟ ᴄᴏᴍᴀɴᴅᴏꜱ\` ${cmds} --_`.trim()
 }
 },
 cawai: {
 name: 'cawai',
 render: ({usermcn, botName, cmds, users, categories})=>{
 let bloques=''
 for(let [cat,list] of categories){
 bloques+=`╭─ 🏮 ${cat.toUpperCase()} \n${list.map(c=>`│ 🍰 ${c.name}`).join('\n')}\n╰──────────────╯\n`
 }
 return `${usermcn} (｡˶ᵔ ᵕ ᵔ˶｡) ¡ 𝙨𝙤𝙮 ${botName.toUpperCase()}! ♡\n📦 Plugins » ${cmds} | 👤 Usuarios » ${users}\n\n${bloques}`.trim()
 }
 },
 acuatico: {
 name: 'acuatico',
 render: ({usermcn, botName, type, cmds, users, categories})=>{
 let bloques=''
 for(let [cat,list] of categories){
 bloques+=`╭─ 🌊 ${cat.toUpperCase()}\n${list.map(c=>`│≋ ${c.name}`).join('\n')}\n╰──────────────╯\n\n`
 }
 return `${usermcn} / 🫧 ${botName} - Deep Sea Edition ⚓\n📦 Plugins » ${cmds} | 👤 Usuarios » ${users}\n\n${bloques}`.trim()
 }
 },
 marino: {
 name: 'marino',
 render: ({usermcn, botName, cmds, users, categories})=>{
 let bloques = ''
 for(let [cat, list] of categories){
 let cl = cat.toLowerCase()
 let ico = '𓆞'
 if(cl.includes('econom') || cl.includes('descarg') || cl.includes('subbot') || cl.includes('poke') || cl.includes('album')) ico = '𓆟'
 if(cl.includes('util') || cl.includes('owner') || cl.includes('gacha') || cl.includes('info') || cl.includes('intel') || cl.includes('nsfw')) ico = '𓆝'
 bloques += `╭─${ico} ༄✦ ${cat.toUpperCase()} ✦༄${ico}─╮\n`
 bloques += list.map(c=>`│ ${ico} 〄 ${c.name}`).join('\n')
 bloques += `\n╰──────────────────╯\n`
 }
 return `${usermcn} / 𝙈𝘼𝙎𝙏𝙀𝙍 𝘾𝙇𝙊𝙑𝙀𝙍 - 𝘽𝙇𝘼𝘾𝙆 𝙎𝙀𝘼 ⚓
Bienvenido a mi menú de comandos. Soy ${botName} 🐚🌊
╭─── Navigating The Deep Ocean ───╮
𓆉 PLUGINS : ${cmds}
𓆝 USERS : ${users}
𓆟 EDITION : LEGACY
╰────────────────────────────────╯
─── ⋆ 🌊 𓊝 𝑴𝑨𝑹𝑰𝑵𝑬 𝑴𝑬𝑵𝑼 𓊝 🌊 ⋆ ───
${bloques}`.trim()
 }
 },
 nares: {
 name: 'nares',
 render: ({usermcn, botName, cmds, users, categories})=>{
 let bloques = ''
 for(let [cat, list] of categories){
 let cl = cat.toLowerCase()
 let ico = '𓆩𝕯𓆪'
 if(cl.includes('menu')) ico = '𓆩♰𓆪'
 if(cl.includes('econom') || cl.includes('descarg') || cl.includes('subbot') || cl.includes('poke') || cl.includes('album')) ico = '𓆩⚰️𓆪'
 if(cl.includes('util') || cl.includes('owner') || cl.includes('gacha') || cl.includes('info') || cl.includes('intel') || cl.includes('nsfw') || cl.includes('activar')) ico = '𓆩♰𓆪'
 if(cl.includes('grupo') || cl.includes('perfil') || cl.includes('juego') || cl.includes('mini')) ico = '𓆩𝕯𓆪'
 let catName = `𝕻𝕬𝕾𝕰𝕾 ${cat.toUpperCase()} 𝕻𝕬𝕾𝕰𝕾`
 bloques += `╭─${ico} ${catName} ${ico}─╮\n`
 bloques += list.map(c=>`│ ${ico} 𝕹 ${c.name}`).join('\n')
 bloques += `\n╰──────────────────────────╯\n`
 }
 return `> ${botName}
~_Bienvenido a mi menú de comandos. Soy ${botName}_ 🦇⚰️
╭─── 𝕬𝖜𝖆𝖐𝖊𝖓𝖎𝖓𝖌 𝕿𝖍𝖊 𝕯𝖆𝖗𝖐 𝕬𝖇𝖞𝖘𝖘 ───╮
𓆩✟𓆪 PLUGINS : ${cmds}
𓆩✟𓆪 USERS : ${users}
𓆩✟𓆪 EDITION : 𝕲𝕺𝕿𝕳𝕴𝕮
╰──────────────────────────────╯
─── ⋆ 𝕷 𝕬 𝕽 𝕺 𝕾 𝕬 𝕸 𝕰 𝕹 𝖀 ⋆ ───
${bloques}`.trim()
 }
 },
 astral: {
 name: 'astral',
 render: ({usermcn, botName, type, cmds, users, categories, hora, fecha, prefix})=>{
 let bloques=''
 for(let [cat,list] of categories){
 bloques+=`╠═ 🔧 ${cat.toUpperCase()} ══\n${list.map(c=>`║ ❀ ${prefix || '.'}${c.name}`).join('\n')}\n`
 }
 return `╔══════════════════╗\n║ *LOCOS Y ASOCIADOS*\n╠═══════════════════\n║ Hola ${usermcn} Soy ${botName}\n║ *Bienvenido a mi menu de comandos*\n║ Tipo: ${type} | Plugins: ${cmds}\n╠════════════════════\n${bloques}\n╚═══════════════╝`.trim()
 }
 },
 galactico: {
 name: 'galactico',
 render: ({usermcn, botName, type, cmds, users, categories})=>{
 let bloques=''
 for(let [cat,list] of categories){
 bloques+=`╭─ 🎮 ${cat} - Galactic\n${list.map(c=>`│ 乂 ${c.name}`).join('\n')}\n╰──────\n\n`
 }
 return `╭━━━━━━━━━━━━━━━━━╮\n┃ THE LEGENCY ┃\n╰━━━━━━━━━━━━━━━━━╯\n${usermcn.trim()} Bienvenido a ${botName} ${type}\nPlugins: ${cmds} | Usuarios: ${users}\n\n${bloques}`.trim()
 }
 },
 hallowen: {
 name: 'hallowen',
 render: ({usermcn, botName, type, cmds, users, categories})=>{
 let bloques=''
 for(let [cat,list] of categories){
 let big = toFancy(cat)
 bloques+=`┏━━━━━ ${big}\n${list.map(c=>` 🎃 ${c.name}`).join('\n')}\n┗━━━✦❘༻༺❘✦━━━┛\n\n`
 }
 return `◢◤◢◤✦ THE LEGENCY ✦◥◣◥◣\n EDITION HALLOWEN\n${usermcn} Bienvenido Soy ${botName} ${type}\nPlugins: ${cmds} | Usuarios: ${users}\n\n${bloques}`.trim()
 }
 },
 electro: {
 name: 'electro',
 render: ({usermcn, botName, type, cmds, users, categories})=>{
 let out = `█▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀█\n█ ${usermcn.trim()} Bienvenido █\n█ ${botName} ${type} █\n█▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄█\n\n`
 for(let [cat,list] of categories){
 out+=`█ ${cat}\n${list.map(c=>`█ ${c.name}`).join('\n')}\n█▄▄▄▄▄▄▄▄▄▄█\n\n`
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
 return `Hola ${usermcn.trim()}! Soy *${botName}* ${type}\nComandos: ${cmds}\n\n${bloques}`.trim()
 }
 }
}

export function getDiseño(name){
 return diseños[name?.toLowerCase()] || diseños['normal']
}
