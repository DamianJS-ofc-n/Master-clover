import fs from 'fs'
export function checkOwner(m){
 let senderIds = [m.sender, m.key?.participant, m.key?.participantAlt, m.participant, m.key?.remoteJid].filter(Boolean)
 let raw = ''
 try { raw = fs.readFileSync('config.js','utf-8') } catch { try { raw = fs.readFileSync('./src/config.js','utf-8') } catch { try { raw = fs.readFileSync('../../config.js','utf-8') } catch {} } }
 let owners = []
 let match = raw.match(/owner\s*:\s*\[([\s\S]*?)\]/)
 if(match){
 try { owners = JSON.parse('['+match[1].replace(/'/g,'"')+']') } catch { owners = match[1].split(',').map(s=>s.replace(/["'\s]/g,'')).filter(Boolean) }
 }
 let allOwners = [...owners, ...(global.owner||[])].flat()
 let norm = s => String(s).toLowerCase().trim()
 let clean = s => String(s).replace(/[^0-9]/g,'')
 return allOwners.some(o=>{
 let oo = norm(o)
 return senderIds.some(s=>{
 let ss = norm(s)
 if(ss===oo) return true
 if(ss.includes(oo) || oo.includes(ss)) return true
 let cn1=clean(ss), cn2=clean(oo)
 if(cn1&&cn2&&(cn1===cn2||cn1.includes(cn2)||cn2.includes(cn1))) return true
 return false
 })
 }) || m.isOwner
}
