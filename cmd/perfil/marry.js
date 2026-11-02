import { getUser, updateUser } from '../../lib/db.js'

export const handler = {}
handler.name = 'marry'
handler.alias = ['casarse']
handler.category = 'profile'

const proposalsCache = new Map()

function getVariants(rawTarget) {
  if (!rawTarget) return []
  const clean = rawTarget.split('@')[0].split(':')[0]
  const withAt = rawTarget.includes('@') ? rawTarget : rawTarget + '@s.whatsapp.net'
  const withLid = clean + '@lid'
  const withDevice = clean + ':1@s.whatsapp.net'
  return [clean, withAt, withLid, withDevice, rawTarget]
}

async function resolveUser(rawTarget, sock, groupJid) {
  if (!rawTarget) return { num: null, variants: [] }
  const clean = rawTarget.split('@')[0].split(':')[0]
  let num = clean
  let resolvedVariants = getVariants(rawTarget)

  if (rawTarget.endsWith('@lid') || rawTarget.includes('@lid')) {
    try {
      if (sock.groupMetadata && groupJid && groupJid.endsWith('@g.us')) {
        const meta = await sock.groupMetadata(groupJid)
        for (const p of meta?.participants || []) {
          const pLid = p.lid?.split('@')[0]?.split(':')[0]
          if (pLid === clean) {
            if (p.phoneNumber) {
              const pn = p.phoneNumber.split('@')[0].split(':')[0]
              return { num: pn, variants: [...resolvedVariants, ...getVariants(pn)] }
            }
            if (p.id && !p.id.includes('@lid')) {
              const pid = p.id.split('@')[0].split(':')[0]
              return { num: pid, variants: [...resolvedVariants, ...getVariants(pid)] }
            }
          }
        }
      }
      const lidMap = sock.signalRepository?.lidMapping
      if (lidMap?.getPNForLID) {
        const pn = await lidMap.getPNForLID(rawTarget)
        if (pn) {
          const pnClean = pn.split('@')[0].split(':')[0]
          return { num: pnClean, variants: [...resolvedVariants, ...getVariants(pnClean)] }
        }
      }
    } catch {}
  }
  return { num, variants: resolvedVariants }
}

handler.exec = async (sock, m, args, ctx) => {
  const from = m.key.remoteJid
  const sender = ctx.sender
  const senderRaw = ctx.senderJid || sender
  
  const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
  const quotedParticipant = m.message?.extendedTextMessage?.contextInfo?.participant
  
  const senderUser = await getUser(sender)
  if (!senderUser) {
    return sock.sendMessage(from, { text: '《✧》 No estás registrado en la base de datos.' }, { quoted: m })
  }

  if (senderUser.marry && senderUser.marry !== 'Sin matrimonio') {
    const partner = await getUser(senderUser.marry)
    return sock.sendMessage(from, { text: `《✧》 Ya estás casado con *${partner?.name || 'alguien'}*.` }, { quoted: m })
  }

  let targetNum = null
  let targetVariants = []
  let isAccepting = false
  let proposerNum = null

  const checkProposal = (variants) => {
    for (const v of variants) {
      if (proposalsCache.has(v)) {
        const prop = proposalsCache.get(v)
        if (prop.to === sender) {
          return { key: v, data: prop }
        }
      }
    }
    return null
  }

  if (quotedParticipant) {
    const resolved = await resolveUser(quotedParticipant, sock, from)
    const found = checkProposal(resolved.variants)
    if (found) {
      isAccepting = true
      proposerNum = found.data.from
    } else {
      targetNum = resolved.num
      targetVariants = resolved.variants
    }
  }

  if (!isAccepting && mentioned.length > 0) {
    const resolved = await resolveUser(mentioned[0], sock, from)
    const found = checkProposal(resolved.variants)
    if (found) {
      isAccepting = true
      proposerNum = found.data.from
    } else {
      targetNum = resolved.num
      targetVariants = resolved.variants
    }
  }

  if (isAccepting && proposerNum) {
    const propToDelete = proposalsCache.get(proposerNum)
    if (propToDelete) {
      for (const v of propToDelete.variants) proposalsCache.delete(v)
    }
    
    await updateUser(sender, { marry: proposerNum })
    await updateUser(proposerNum, { marry: sender })

    const proposerUser = await getUser(proposerNum)
    const proposerName = proposerUser?.name || proposerNum
    const senderName = senderUser.name || sender

    return sock.sendMessage(from, { text: 
      `✩.･:｡≻───── ⋆♡⋆ ─────.•:｡✩\n¡Se han Casado! ฅ^•ﻌ•^ฅ*:･ﾟ✧\n\n` +
      `*•.¸♡ ${proposerName} ♡¸.•*\n` +
      `*•.¸♡ ${senderName} ♡¸.•*\n\n` +
      `\`Disfruten de su luna de miel\`\n\n` +
      `✩.･:｡≻───── ⋆♡⋆ ─────.•:｡✩`
    }, { quoted: m })
  }

  if (!targetNum) {
    return sock.sendMessage(from, { text: '《✧》 Debes mencionar a alguien o responder a un mensaje para usar este comando.' }, { quoted: m })
  }

  if (sender === targetNum) {
    return sock.sendMessage(from, { text: '《✧》 No puedes casarte contigo mismo.' }, { quoted: m })
  }

  const targetUser = await getUser(targetNum)
  if (!targetUser) {
    return sock.sendMessage(from, { text: '《✧》 El usuario mencionado no está registrado.' }, { quoted: m })
  }

  if (targetUser.marry && targetUser.marry !== 'Sin matrimonio') {
    const partner = await getUser(targetUser.marry)
    return sock.sendMessage(from, { text: `《✧》 *${targetUser.name || targetNum}* ya está casado con *${partner?.name || 'alguien'}*.` }, { quoted: m })
  }

  const checkSenderProposal = checkProposal(getVariants(sender).concat(getVariants(senderRaw)))
  if (checkSenderProposal && checkSenderProposal.data.to === targetNum) {
    for (const v of checkSenderProposal.data.variants) proposalsCache.delete(v)
    await updateUser(sender, { marry: targetNum })
    await updateUser(targetNum, { marry: sender })
    
    return sock.sendMessage(from, { text: 
      `✩.･:｡≻───── ⋆♡⋆ ─────.•:｡✩\n¡Se han Casado! ฅ^•ﻌ•^ฅ*:･ﾟ✧\n\n` +
      `*•.¸♡ ${senderUser.name || sender} ♡¸.•*\n` +
      `*•.¸♡ ${targetUser.name || targetNum} ♡¸.•*\n\n` +
      `\`Disfruten de su luna de miel\`\n\n` +
      `✩.･:｡≻───── ⋆♡⋆ ─────.•:｡✩`
    }, { quoted: m })
  }

  const senderVars = [...getVariants(sender), ...getVariants(senderRaw)]
  const targetVars = [...targetVariants, ...getVariants(targetNum)]

  for (const v of senderVars) {
    proposalsCache.set(v, { to: targetNum, from: sender, variants: senderVars })
  }

  const proposerDisplayName = senderUser.name || sender
  const targetDisplayName = targetUser.name || targetNum

  await sock.sendMessage(from, {
    text: `♡ *${targetDisplayName}*, el usuario *${proposerDisplayName}* te ha enviado una propuesta de matrimonio, ¿aceptas? •(=^●ω●^=)•\n\n` +
          `⚘ *Para aceptar, responde a CUALQUIER mensaje suyo con:*\n` +
          `> *.marry*\n` +
          `> O menciona al usuario: *.marry @${proposerDisplayName}*\n` +
          `> La propuesta expirará en 2 minutos.`,
    mentions: [sender + '@s.whatsapp.net', targetNum + '@s.whatsapp.net']
  }, { quoted: m })

  setTimeout(() => {
    for (const v of senderVars) {
      const p = proposalsCache.get(v)
      if (p && p.to === targetNum) proposalsCache.delete(v)
    }
  }, 120000)
}

export default handler