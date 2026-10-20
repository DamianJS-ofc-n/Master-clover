export const onlineCache = new Map()

export function initOnlineCache(sock) {
 global.onlineCache = global.onlineCache || onlineCache

 sock.ev.on('presence.update', async (update) => {
 if (!update?.presences) return
 for (let [id, data] of Object.entries(update.presences)) {
 const state = data.lastKnownPresence || data.presence || ''
 if (['available','composing','recording','paused'].includes(state)) {
 global.onlineCache.set(id, Date.now())
 if (id.endsWith('@lid')) {
 try {
 const pn = await sock.signalRepository?.lidMapping?.getPNForLID?.(id)
 if (pn) {
 const jid = pn.includes('@')? pn : `${pn}@s.whatsapp.net`
 global.onlineCache.set(jid, Date.now())
 }
 } catch {}
 }
 }
 }
 })
 console.log('✅ [onlineCache] activo')
}
