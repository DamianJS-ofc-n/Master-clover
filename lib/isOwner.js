import config from '../config.js'

function clean(v){ return String(v).split('@')[0].split(':')[0].replace(/\D/g,'') }

export function isOwnerCheck(senderRaw, senderResolved, senderClean){
 const owners = [].concat(config.bot?.owner || config.owner || []).filter(Boolean)
 const cleanList = owners.map(o => clean(o)).filter(Boolean)
 const rawList = owners.map(o => String(o).toLowerCase().replace(/@.*/,'').split(':')[0].trim()).filter(Boolean)
 
 const raws = [senderRaw].filter(Boolean).map(s=>String(s).toLowerCase())
 const cleans = [senderResolved, senderClean, ...raws.map(r=>clean(r))].filter(Boolean)

 for(let r of raws){
 let base = r.split('@')[0]
 if(rawList.includes(base) || rawList.includes(r)) return true
 }
 for(let c of cleans){
 if(cleanList.includes(c)) return true
 }
 return false
}
