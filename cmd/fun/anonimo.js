export const handler = {}
handler.name = 'anon'
handler.alias = ['secreto','confesion','anonimo']
handler.category = 'fun'
handler.description = 'Envia un secreto anonimo al grupo'

handler.exec = async (sock, m, a) => {
  const chatId = m.key.remoteJid
  const textoRaw = a.join(" ").trim()
  if(!textoRaw) return sock.sendMessage(chatId,{text:"✳️ Usa:.anon tu secreto\nEj:.anon tengo crush en @alguien"}, {quoted:m})
  const autorReal = m.key.participant || m.key.remoteJid
  const oculto = autorReal.split('@')[0]
  try{ await sock.sendMessage(chatId,{delete:m.key}) }catch{}
  if(!global.anonConfessions) global.anonConfessions = new Map()
  if(!global.anonListener){
    global.anonListener = true
    sock.ev.on("messages.upsert", async (up)=>{
      try{
        const msg = up.messages?.[0]
        if(!msg?.message?.reactionMessage) return
        const reaction = msg.message.reactionMessage
        const reactor = msg.key.participant || msg.key.remoteJid
        const data = global.anonConfessions.get(reaction.key?.id)
        if(!data) return
        const emoji = reaction.text || ""
        if(["👀","🔍","🕵️","❓"].includes(emoji)){
          const pista = data.autor.slice(0,3)+"***"+data.autor.slice(-2)
          await sock.sendMessage(data.chatId,{text:`🕵️ @${reactor.split('@')[0]} reaccionó ${emoji} para descubrir al anon\nPista: ${pista}`, mentions:[reactor]})
        }
      }catch{}
    })
  }
  const mention = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
  const sent = await sock.sendMessage(chatId,{text:`📩 *CONFESIÓN ANÓNIMA* 📩\n\n"${textoRaw}"\n\n💡 Reacciona 👀 para pista\n— Anónimo 🤫`, mentions: mention? [mention]:[]})
  if(sent?.key?.id) {
    global.anonConfessions.set(sent.key.id, {autor:oculto, chatId})
    setTimeout(()=> global.anonConfessions.delete(sent.key.id), 600000)
  }
}