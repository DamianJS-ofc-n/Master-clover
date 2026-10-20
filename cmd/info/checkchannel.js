export const handler = {}
handler.name = 'checkchannel'
handler.alias = ['ccanal']
handler.category = 'info'
handler.exec = async (sock,m,a)=>{
  const chatId = m.key.remoteJid
  let input = (Array.isArray(a)?a.join(" "):"").trim()
  if(!input) return sock.sendMessage(chatId,{text:"✳️.checkchannel link"}, {quoted:m})
  let code = input
  if(code.includes("channel/")) code = code.split("channel/")[1].split("/")[0].split("?")[0]

  try{
    let meta = null
    try{ meta = await sock.newsletterMetadata("invite", code) }catch(e){}
    if(!meta) throw new Error("No pude obtener datos, prueba con Baileys 6.7.18+")

    const name = meta.name || meta.thread_metadata?.name?.text || "Sin nombre"
    const desc = meta.description || meta.thread_metadata?.description?.text || "Sin descripción"
    const subs = meta.subscribers_count?? meta.thread_metadata?.subscribers_count?? 0
    const verifRaw = meta.verification?? meta.thread_metadata?.verification?? 0
    const verif = (verifRaw==2 || verifRaw=="VERIFIED")? "✅ Verificado" : "❌ No verificado"
    const creation = meta.creation_time? new Date(meta.creation_time*1000).toLocaleDateString('es-ES') : "Desconocida"
    const invite = meta.invite? `https://whatsapp.com/channel/${meta.invite}` : input
    const id = meta.id || ""

    const txt = `────────────────────
⚔️ *Nombre:* ${name}
📊 *Seguidores:* ${subs.toLocaleString?subs.toLocaleString():subs}
👾 *Descripción:* ${desc}
📢 *Verificado?:* ${verif}
📅 *Creado:* ${creation}
🔗 *Link:* ${invite}
🆔 *ID:* ${id}
────────────────────`

    await sock.sendMessage(chatId,{text:txt},{quoted:m})

  }catch(e){
    console.error(e)
    await sock.sendMessage(chatId,{text:`❌ ${e.message}`},{quoted:m})
  }
}