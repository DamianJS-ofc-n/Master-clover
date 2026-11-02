import { formatMoney } from '../../core/economy.js'
import { getUser, getTopUsers, registerUser, updateUser } from '../../lib/db.js'

export const handler = {}
handler.name = 'perfil'
handler.alias = ['profile', 'me', 'yo']
handler.category = 'Economy'

handler.exec = async (sock, m, args, ctx) => {
  try {
    let jid = m.key.remoteJid
    
    let rawTarget = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.message?.extendedTextMessage?.contextInfo?.participant || m.key.participant || m.participant || m.key.remoteJid
    
    let targetNum = ctx.sender
    
    if (rawTarget !== (m.key.participant || m.participant) && rawTarget !== m.key.remoteJid) {
      targetNum = rawTarget.split('@')[0]
      if (rawTarget.endsWith('@lid')) {
        try {
          if (sock.groupMetadata && jid.endsWith('@g.us')) {
            const meta = await sock.groupMetadata(jid)
            for (const p of meta?.participants || []) {
              if (p.lid?.split('@')[0] === targetNum) {
                if (p.phoneNumber) targetNum = p.phoneNumber.split('@')[0]
                else if (p.id && !p.id.endsWith('@lid')) targetNum = p.id.split('@')[0]
                break
              }
            }
          }
          if (targetNum === rawTarget.split('@')[0]) {
            const lidMap = sock.signalRepository?.lidMapping
            if (lidMap?.getPNForLID) {
              const pn = await lidMap.getPNForLID(rawTarget)
              if (pn) targetNum = pn.split('@')[0]
            }
          }
        } catch {}
      }
    }
    
    let userDB = await getUser(targetNum)
    
    if (!userDB) {
      userDB = await registerUser(targetNum, ctx.pushName)
    } else if (ctx.pushName && userDB.name !== ctx.pushName && targetNum === ctx.sender) {
      await updateUser(targetNum, { name: ctx.pushName })
      userDB.name = ctx.pushName
    }
    
    if (!userDB) {
      userDB = { name: ctx.pushName, exp: 0, lvl: 1, rango: 'Novato 🌱' }
    }

    let displayName = userDB.name || targetNum

    const topUsers = await getTopUsers(100)
    let rank = topUsers.findIndex(u => u.number === targetNum) + 1
    if (rank <= 0) rank = '?'

    let marriedName = 'Soltero'
    if (userDB.marry && userDB.marry !== 'Sin matrimonio') {
      try {
        const marriedDB = await getUser(userDB.marry)
        marriedName = marriedDB ? marriedDB.name : 'Casado'
      } catch {
        marriedName = 'Casado'
      }
    }

    let txt = `❀ *Perfil* ◤ ${displayName} ◢

❏ Nombre » *${displayName}*
❏ Edad » *${userDB.edad ? userDB.edad + ' años' : 'No definido'}*
❏ Cumpleaños » *${userDB.birthday || 'No definido'}*
❑ Género » *${userDB.genre || 'No definido'}*
❑ Pasatiempo » *${userDB.hobby || 'No definido'}*
❑ Descripción » *${userDB.description || 'No definido'}*
❑ Casado » *${marriedName}*

❆ Experiencia » *${userDB.exp || 0}*
✠ Nivel » *${userDB.lvl || 1}*
❖ Rango » *${userDB.rango || 'Novato 🌱'}*
✤ Puesto de top » *#${rank}*`

    let ppUrl = null
    try { ppUrl = await sock.profilePictureUrl(rawTarget, 'image') } catch {}

    if (ppUrl) {
      await sock.sendMessage(jid, { 
        image: { url: ppUrl }, 
        caption: txt
      }, { quoted: m })
    } else {
      await sock.sendMessage(jid, { 
        text: txt
      }, { quoted: m })
    }
  } catch (err) {
    console.log('ERROR PERFIL:', err)
    sock.sendMessage(m.key.remoteJid, { text: '❌ Error al obtener el perfil.' }, { quoted: m })
  }
}

export default handler