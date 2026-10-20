import config from '../../config.js'
import fs from 'fs'
import path from 'path'

export const handler = {}
handler.name = 'backup'
handler.alias = ['bk','respaldo','save']
handler.category = 'owner'
handler.owner = true

const crcTable = new Uint32Array(256)
for(let n=0;n<256;n++){ let c=n; for(let i=0;i<8;i++) c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1); crcTable[n]=c>>>0 }
function crc32(buf){ let c=0xffffffff; for(const b of buf) c=crcTable[(c^b)&255]^(c>>>8); return (c^0xffffffff)>>>0 }
function makeZip(filesMap){
 const chunks=[], central=[]; let offset=0
 for(const [name, contents] of Object.entries(filesMap)){
 const file=Buffer.from(contents), label=Buffer.from(name.replace(/\\/g,'/'),'utf8'), crc=crc32(file)
 const local=Buffer.alloc(30); local.writeUInt32LE(0x04034b50,0); local.writeUInt16LE(20,4); local.writeUInt16LE(0,8); local.writeUInt32LE(crc,14); local.writeUInt32LE(file.length,18); local.writeUInt32LE(file.length,22); local.writeUInt16LE(label.length,26)
 const record=Buffer.alloc(46); record.writeUInt32LE(0x02014b50,0); record.writeUInt16LE(20,4); record.writeUInt16LE(20,6); record.writeUInt16LE(0,8); record.writeUInt32LE(crc,16); record.writeUInt32LE(file.length,20); record.writeUInt32LE(file.length,24); record.writeUInt16LE(label.length,28); record.writeUInt32LE(offset,42)
 chunks.push(local,label,file); central.push(record,label); offset+=local.length+label.length+file.length
 }
 const centralSize=central.reduce((s,c)=>s+c.length,0)
 const end=Buffer.alloc(22); end.writeUInt32LE(0x06054b50,0); end.writeUInt16LE(Object.keys(filesMap).length,8); end.writeUInt16LE(Object.keys(filesMap).length,10); end.writeUInt32LE(centralSize,12); end.writeUInt32LE(offset,16)
 return Buffer.concat([...chunks,...central,end])
}

function getAllFiles(dir, fileList=[], baseDir=dir){
 if(!fs.existsSync(dir)) return fileList
 if(fs.statSync(dir).isFile()){ fileList.push({full:dir, rel:path.relative(baseDir,dir)}); return fileList }
 for(const file of fs.readdirSync(dir)){
 if(file==='node_modules' || file==='.git' || file==='storage') continue
 const full=path.join(dir,file)
 try{
 const s=fs.statSync(full)
 if(s.isDirectory()) getAllFiles(full,fileList,baseDir)
 else fileList.push({full, rel:path.relative(baseDir,full)})
 }catch{}
 }
 return fileList
}

handler.exec = async (...args) => {
 let sock,m,a
 if(args[0]?.key){ m=args[0]; sock=args[1]?.conn||global.conn; a=args[1]?.args||[] }
 else { sock=args[0]; m=args[1]; a=args[2]||[] }
 const from=m.key.remoteJid
 const textArgs=a.join(' ').trim()

 let targets=!textArgs?['.']: textArgs.toLowerCase()==='all'||textArgs.toLowerCase()==='todo'?['all'] : textArgs.split(/[\s,\/]+/).map(s=>s.trim()).filter(Boolean)

 const baseDir=process.cwd()
 const tmpDir=path.join(baseDir,'storage','temp','backups')
 if(!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir,{recursive:true})

 for(const input of targets){
 try{
 let filesMap={}, zipName=''
 if(input==='all'){
 // PROTECCION: all ya no incluye node_modules
 const list=getAllFiles(baseDir)
 for(const f of list){
 if(f.rel.includes('storage/temp/backups')) continue
 try{ if(fs.statSync(f.full).size > 10*1024*1024) continue; filesMap[f.rel]=fs.readFileSync(f.full) }catch{}
 }
 zipName=`backup-ALL-${Date.now()}.zip`
 } else if(input==='.' || input==='full'){
 const list=getAllFiles(baseDir)
 for(const f of list){ try{ filesMap[f.rel]=fs.readFileSync(f.full) }catch{} }
 zipName=`backup-full-${Date.now()}.zip`
 } else {
 const targetPath=path.join(baseDir,input)
 if(!fs.existsSync(targetPath)){ await sock.sendMessage(from,{text:`❌ No existe: *${input}*`},{quoted:m}); continue }
 if(fs.statSync(targetPath).isFile()){ filesMap[path.basename(input)]=fs.readFileSync(targetPath); zipName=`backup-${path.basename(input)}-${Date.now()}.zip` }
 else {
 const list=getAllFiles(targetPath,[],targetPath)
 for(const f of list){ try{ filesMap[path.join(path.basename(input),f.rel)]=fs.readFileSync(f.full) }catch{} }
 zipName=`backup-${path.basename(input)}-${Date.now()}.zip`
 }
 }
 if(!Object.keys(filesMap).length){ await sock.sendMessage(from,{text:`❌ Vacío`},{quoted:m}); continue }
 const zipBuffer=makeZip(filesMap)
 if(zipBuffer.length > 90*1024*1024){ await sock.sendMessage(from,{text:`❌ Muy grande ${(zipBuffer.length/1024/1024).toFixed(1)}MB, max 90MB para WhatsApp`},{quoted:m}); continue }
 const outPath=path.join(tmpDir,zipName)
 fs.writeFileSync(outPath,zipBuffer)
 await sock.sendMessage(from,{document:fs.readFileSync(outPath), mimetype:'application/zip', fileName:zipName, caption:`✅ ${input} | ${Object.keys(filesMap).length} archivos | ${(zipBuffer.length/1024/1024).toFixed(2)} MB`},{quoted:m})
 try{fs.unlinkSync(outPath)}catch{}
 }catch(e){ await sock.sendMessage(from,{text:`❌ Error ${input}: ${e.message}`},{quoted:m}) }
 }
}
