import { downloadMediaMessage } from '@whiskeysockets/baileys';
import axios from 'axios';
import { createCanvas, loadImage } from 'canvas';

function crearBarra(p) {
  const t = 10;
  const l = Math.round((p/100)*t);
  return `[${'█'.repeat(l)}${'░'.repeat(t-l)}]`;
}

export const handler = {}
handler.name = 'gay'
handler.category = 'fun'

handler.exec = async (sock, msg, args) => {
  try {
    const from = msg.key.remoteJid;
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
    ? { message: msg.message.extendedTextMessage.contextInfo.quotedMessage, sender: msg.message.extendedTextMessage.contextInfo.participant, id: msg.message.extendedTextMessage.contextInfo.stanzaId }
     : null;
    const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    let targetJid = null;
    let tieneImagen = false;

    if (quoted && quoted.message?.imageMessage) {
      targetJid = quoted.sender; tieneImagen = true;
    } else if (mentionedJid.length > 0) {
      targetJid = mentionedJid[0];
    } else if (quoted && quoted.sender) {
      targetJid = quoted.sender;
    } else {
      targetJid = msg.key.participant || from;
    }

    let mediaBuffer = null;
    if (tieneImagen) {
      const qObj = { key: { remoteJid: from, id: quoted.id, participant: quoted.sender || from, fromMe: false }, message: { imageMessage: quoted.message.imageMessage } };
      mediaBuffer = await downloadMediaMessage(qObj, 'buffer', {}, { logger: { level: 'silent' }, reuploadRequest: sock.updateMediaMessage });
    } else {
      try {
        const ppUrl = await sock.profilePictureUrl(targetJid, 'image');
        const ppRes = await axios.get(ppUrl, { responseType: 'arraybuffer', timeout: 15000 });
        mediaBuffer = Buffer.from(ppRes.data);
      } catch { return sock.sendMessage(from, { text: '《✧》No se pudo obtener la foto.' }, { quoted: msg }); }
    }

    const porcentaje = Math.floor(Math.random() * 101);

    // === CANVAS GAY ===
    const canvas = createCanvas(512, 512);
    const ctx = canvas.getContext('2d');

    const img = await loadImage(mediaBuffer);
    ctx.drawImage(img, 0, 0, 512, 512);

    // arcoiris con transparencia
    ctx.globalAlpha = 0.55;
    const colors = ['#FF0000','#FF9A00','#FFFF00','#00FF00','#0000FF','#4B0082','#9400D3'];
    const h = 512 / colors.length;
    colors.forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.fillRect(0, i*h, 512, h);
    });
    ctx.globalAlpha = 1;

    const gayBuffer = canvas.toBuffer('image/jpeg');

    const targetNumber = targetJid.split('@')[0].split(':')[0];
    const barra = crearBarra(porcentaje);
    const caption = `╭─ *GAY 🏳️‍🌈* ─\n│ @${targetNumber} es *${porcentaje}%* gay\n│ ${barra} ${porcentaje}%\n╰───────\n\n>  「✐」Master Cløver`;

    await sock.sendMessage(from, { image: gayBuffer, caption, mentions: [targetJid] }, { quoted: msg });

  } catch (error) {
    console.error('❌ Error en gay:', error);
    await sock.sendMessage(msg.key.remoteJid, { text: `❌ Error: ${error.message}` }, { quoted: msg });
  }
}
