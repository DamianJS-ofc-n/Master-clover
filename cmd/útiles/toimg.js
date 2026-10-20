import * as cheerio from 'cheerio';

async function webp2mp4(source) {
 let form = new FormData(); form.append('new-image', new Blob([source]), 'image.webp');
 let res = await fetch('https://ezgif.com/webp-to-mp4', { method:'POST', body: form });
 let html = await res.text(); const $ = cheerio.load(html); let obj={};
 $('form input[name]').each((i,el)=>{ obj[$(el).attr('name')]=$(el).val() });
 let form2 = new FormData(); for(let k in obj) form2.append(k,obj[k]);
 let res2 = await fetch('https://ezgif.com/webp-to-mp4/'+obj.file, { method:'POST', body: form2 });
 let html2 = await res2.text(); const $2 = cheerio.load(html2);
 const videoUrl = new URL($2('div#output > p.outfile > video > source').attr('src'), res2.url).toString();
 return Buffer.from(await (await fetch(videoUrl)).arrayBuffer());
}
async function webp2png(source) {
 let form = new FormData(); form.append('new-image', new Blob([source]), 'image.webp');
 let res = await fetch('https://ezgif.com/webp-to-png', { method:'POST', body: form });
 let html = await res.text(); const $ = cheerio.load(html); let obj={};
 $('form input[name]').each((i,el)=>{ obj[$(el).attr('name')]=$(el).val() });
 let form2 = new FormData(); for(let k in obj) form2.append(k,obj[k]);
 let res2 = await fetch('https://ezgif.com/webp-to-png/'+obj.file, { method:'POST', body: form2 });
 let html2 = await res2.text(); const $2 = cheerio.load(html2);
 const imgUrl = new URL($2('div#output > p.outfile > img').attr('src'), res2.url).toString();
 return Buffer.from(await (await fetch(imgUrl)).arrayBuffer());
}

export const handler = {}
handler.name = 'toimg'
handler.alias = ['toimage']
handler.category = 'utils'

handler.exec = async (sock, m) => {
 let jid = m.key.remoteJid
 const ctx = m.message?.extendedTextMessage?.contextInfo
 const quotedMsg = ctx?.quotedMessage
 const quotedStanzaId = ctx?.stanzaId
 const quotedParticipant = ctx?.participant

 let msgToDownload = null
 if (quotedMsg?.stickerMessage) {
 msgToDownload = { key: { remoteJid: jid, id: quotedStanzaId, fromMe: false, participant: quotedParticipant }, message: quotedMsg }
 } else if (m.message?.stickerMessage) {
 msgToDownload = m
 } else {
 return sock.sendMessage(jid, { text: `《✧》 Cita un sticker con.toimg` }, { quoted: m })
 }

 try {
 let downloadMediaMessage
 try { ({ downloadMediaMessage } = await import('baileys')) } catch { ({ downloadMediaMessage } = await import('@whiskeysockets/baileys')) }

 await sock.sendMessage(jid, { react: { text:'🕒', key: m.key } })
 const buffer = await downloadMediaMessage(msgToDownload, 'buffer', {}, { logger: console, reuploadRequest: sock.updateMediaMessage })
 if (!buffer) throw new Error('buffer vacio')

 const isAnimated = quotedMsg?.stickerMessage?.isAnimated || m.message?.stickerMessage?.isAnimated
 if (isAnimated) {
 const mp4 = await webp2mp4(buffer)
 await sock.sendMessage(jid, { video: mp4, gifPlayback:true, caption:'ꕥ *Aquí tienes*' }, { quoted: m })
 } else {
 const png = await webp2png(buffer)
 await sock.sendMessage(jid, { image: png, caption:'ꕥ *Aquí tienes*' }, { quoted: m })
 }
 await sock.sendMessage(jid, { react: { text:'✔️', key: m.key } })
 } catch(e) {
 console.log('[TOIMG]', e)
 await sock.sendMessage(jid, { react: { text:'✖️', key: m.key } })
 await sock.sendMessage(jid, { text:`《✧》 Error: ${e.message}` }, { quoted: m })
 }
}
