import handlerBase from '../../lib/jadi.js'

export const handler = {}
handler.name = 'code'
handler.alias = ['serbot', 'jadibot', 'subbot', 'masters']
handler.category = 'jadi'

const {
  getPairingCode,
  getSub,
  getSubConfig,
  getConnectionStatus,
  waitForSubConnection,
  cleanNumber,
  isValidBotNumber
} = handlerBase

const clean = (n = '') => String(n).split('@')[0].split(':')[0].replace(/\D/g, '')

async function lidToPn(lid, sock) {
  let jid = String(lid)
  if (!jid.includes('@')) jid = jid + '@lid'
  try {
    let pn = await sock.signalRepository?.lidMapping?.getPNForLID?.(jid)
    if (pn) return clean(pn)
  } catch {}
  return null
}

async function getNumber(m, sock) {
  for (let k of [m.key?.participantPn, m.key?.remoteJidPn, m.senderPn]) {
    if (k) {
      let n = clean(k)
      if (n.length >= 8 && n.length <= 15) return n
    }
  }
  let raw = String(m.sender || m.key?.remoteJid || '')
  if (raw.includes('@lid')) {
    let pn = await lidToPn(raw, sock)
    if (pn) return pn
  }
  return clean(raw)
}

function normalizeTarget(target) {
  if (!target) return ''
  let t = clean(target)
  if (t.length === 14 && t.startsWith('54') && t.endsWith('0')) {
    t = t.slice(0, -1)
  }
  return t
}

function buildCaption(target) {
  return `ㅤ ロ⃝ ❀ \`Sub-Bots masters\` ᗤᗤ
*Conecta un Sub-bot para el número » ${target}*

🥷 *Pasos de vinculación*
⚔️ 1️⃣ *Abre WhatsApp » Ajustes*
⚔️ 2️⃣ *Dispositivos vinculados*
⚔️ 3️⃣ *Vincular un dispositivo > Vincular con número de teléfono*
⚔️ 4️⃣ *Pega el código que te doy abajo*

> Expira en 60 segundos`
}

handler.exec = async (sock, m) => {
  const jid = m.key.remoteJid
  const body = m.message?.conversation || m.message?.extendedTextMessage?.text || ''
  const args = body.trim().split(/\s+/).slice(1)

  let target = args[0] ? clean(args[0]) : await getNumber(m, sock)
  target = normalizeTarget(target)

  if (!target || !isValidBotNumber(target)) {
    return sock.sendMessage(
      jid,
      {
        text: `❌ No pude sacar un número válido\nUsa: .code 5492645746772\nTu LID es: ${m.sender}`
      },
      { quoted: m }
    )
  }

  const existing = getSub(target)
  if (existing?.sock?.authState?.creds?.registered === true && existing.sock.user) {
    return sock.sendMessage(jid, { text: `✅ ${target} ya está vinculado` }, { quoted: m })
  }

  await sock.sendMessage(jid, { text: `⏳ Generando código para ${target}...` }, { quoted: m })

  const config = getSubConfig(target)

  try {
    const result = await getPairingCode(target, config)

    if (result.status === 'connected') {
      return sock.sendMessage(jid, { text: `✅ ${target} ya está vinculado` }, { quoted: m })
    }

    if (result.status === 'timeout') {
      return sock.sendMessage(
        jid,
        { text: `⏱️ No se pudo generar el código a tiempo para ${target}. Intenta de nuevo en unos segundos.` },
        { quoted: m }
      )
    }

    if (result.status === 'pending' && result.code) {
      await sock.sendMessage(jid, { text: buildCaption(target) }, { quoted: m })
      await sock.sendMessage(jid, { text: `*${result.code}*` }, { quoted: m })

      waitForSubConnection(target, 180_000)
        .then(async (ok) => {
          if (ok) {
            try {
              await sock.sendMessage(
                jid,
                { text: `✅ Sub-bot ${target} conectado!` },
                { quoted: m }
              )
            } catch {}
          }
        })
        .catch(() => {})
      return
    }

    await sock.sendMessage(
      jid,
      { text: `❌ No se pudo generar el código para ${target}. Intenta de nuevo.` },
      { quoted: m }
    )
  } catch (e) {
    console.log('[CODE ERROR]', e)
    await sock.sendMessage(
      jid,
      {
        text: `❌ Error: ${e.message}\n\nAsegúrate de poner el número sin + y sin espacios.\nEj: .code 5492645746772`
      },
      { quoted: m }
    )
  }
}

export default handler