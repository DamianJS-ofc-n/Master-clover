export const handler = {}
handler.name = 'pacman'
handler.alias = ['pacmangame']
handler.category = 'Fun'
handler.exec = async (sock, m) => {
    const GAME_DATA = {
        messageContextInfo: {
            deviceListMetadata: {},
            deviceListMetadataVersion: 2
        },
        botForwardedMessage: {
            message: {
                richResponseMessage: {
                    messageType: 1,
                    submessages: [{ messageType: 2, messageText: "Nexus - Pacman Kawaii" }],
                    unifiedResponse: {
                        data: Buffer.from(JSON.stringify({
                            response_id: "pacman-kawaii-nexus",
                            sections: [{
                                view_model: {
                                    primitive: {
                                        __typename: "GenAIaeacdsnwHtmlPrimitive",
                                        payload: `<style>*{tap-highlight-color:transparent;user-select:none}body{margin:0;background:#111017;font-family:Quicksand,sans-serif;color:#fff;touch-action:none}.wrap{max-width:520px;margin:auto;padding:14px}.box{background:#1d1b2f;border:2px solid rgba(255,255,255,.1);border-radius:26px;padding:16px;box-shadow:0 12px 40px rgba(0,0,0,.6)}canvas{width:100%;aspect-ratio:1/1;background:#000;border-radius:16px;display:block}.top{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}.score{background:rgba(255,255,255,.08);padding:6px 16px;border-radius:20px;font-weight:800;color:#ffe88a}.controls{display:grid;grid-template-columns:64px 64px 64px;gap:8px;justify-content:center;margin-top:14px}.cbtn{width:64px;height:64px;border-radius:18px;border:none;background:#2a2842;color:#fff;font-size:26px;font-weight:900;box-shadow:0 6px 0 #1a1830}.cbtn:active{transform:translateY(3px);box-shadow:0 3px 0 #1a1830}</style><body><div class="wrap"><div class="box"><div class="top"><div><div style="font-size:10px;letter-spacing:2px;color:#ff9a9e;font-weight:900">NEXUS ARCADE</div><div style="font-size:22px;font-weight:900">PACMAN ☁️</div></div><div class="score">PTS <b id="sc">0</b></div></div><canvas id="g" width="420" height="420"></canvas><div class="controls"><div></div><button class="cbtn" id="up">↑</button><div></div><button class="cbtn" id="left">←</button><button class="cbtn" id="down">↓</button><button class="cbtn" id="right">→</button></div></div></div><script>
const canvas=document.getElementById('g'),ctx=canvas.getContext('2d'),scEl=document.getElementById('sc');
const tile=21, cols=20, rows=20;
let map=[
[1,1,1,1,1,1,1,1],
[1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1],
[1,0,1,1,0,1,1,0,1,1,0,1],
[1,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,1],
[1,1,1,1,0,1,0,0,1,1,1,1,0,0,1,0,1,1,1,1],
[1,0,0,0,0,0,0,1,1,0,0,1,1,0,0,0,0,0,0,1],
[1,0,1,1,0,1,0,1,1,0,0,1,1,0,1,0,1,1,0,1],
[1,0,0,1,0,1,0,0,0,0,0,0,0,0,1,0,1,0,0,1],
[1,1,0,1,0,1,1,1,0,1,1,1,0,1,1,0,1,0,1,1],
[1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1],
[1,0,1,1,0,1,1,0,1,1,0,1],
[1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1],
[1,1,0,1,0,1,0,1,1,1,1,1,1,0,1,0,1,0,1,1],
[1,0,0,0,0,1,0,0,0,1,1,0,0,0,1,0,0,0,0,1],
[1,0,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,0,1],
[1,0,0,0,0,0,0,1],
[1,0,1,1,0,1,0,1,1,1,1,1,1,0,1,0,1,1,0,1],
[1,0,0,1,0,1,0,0,0,1,1,0,0,0,1,0,1,0,0,1],
[1,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,1],
[1,1,1,1,1,1,1,1],
];
let dots=[];
for(let y=0;y<rows;y++) for(let x=0;x<cols;x++) if(map[y][x]==0 && !(x==1&&y==1)) dots.push({x,y});
let p={x:1,y:1,dx:0,dy:0,ndx:0,ndy:0};
let ghosts=[{x:9,y:9,c:'#ff6b6b',dx:1},{x:10,y:9,c:'#6bc5ff',dx:-1},{x:9,y:10,c:'#ffb6ff',dx:0,dy:1}];
let score=0,over=false;

function canMove(x,y){return y>=0&&y<rows&&x>=0&&x<cols&&map[y][x]!==1}
function reset(){dots=[];for(let y=0;y<rows;y++) for(let x=0;x<cols;x++) if(map[y][x]==0 && !(x==1&&y==1)) dots.push({x,y}); p={x:1,y:1,dx:0,dy:0,ndx:1,ndy:0}; score=0; over=false; scEl.textContent=0;}

let tick=0;
function update(){
 if(over) return;
 tick++;
 if(tick%8===0){
   if(canMove(p.x+p.ndx,p.y+p.ndy)){p.dx=p.ndx;p.dy=p.ndy}
   if(canMove(p.x+p.dx,p.y+p.dy)){p.x+=p.dx;p.y+=p.dy}
   let idx=dots.findIndex(d=>d.x==p.x&&d.y==p.y);
   if(idx!==-1){dots.splice(idx,1); score+=10; scEl.textContent=score}
   if(dots.length==0){over=true}
   ghosts.forEach(g=>{
     let dirs=[[1,0],[-1,0],[0,1],[0,-1]].filter(d=>canMove(g.x+d[0],g.y+d[1]));
     if(dirs.length && Math.random()<0.3) {let r=dirs[Math.floor(Math.random()*dirs.length)]; g.dx=r[0]; g.dy=r[1]}
     if(canMove(g.x+g.dx,g.y+g.dy)){g.x+=g.dx;g.y+=g.dy} else {g.dx*=-1; g.dy*=-1}
     if(g.x==p.x&&g.y==p.y) over=true;
   });
 }
}
function draw(){
 ctx.fillStyle='#000'; ctx.fillRect(0,0,420,420);
 ctx.fillStyle='#1e3a8a'; for(let y=0;y<rows;y++) for(let x=0;x<cols;x++) if(map[y][x]==1) ctx.fillRect(x*tile,y*tile,tile-1,tile-1);
 ctx.fillStyle='#ffe88a'; dots.forEach(d=>{ctx.beginPath();ctx.arc(d.x*tile+tile/2,d.y*tile+tile/2,3,0,Math.PI*2);ctx.fill()});
 ctx.fillStyle='#ffec4a'; ctx.beginPath(); ctx.arc(p.x*tile+tile/2,p.y*tile+tile/2,9,0.2*Math.PI,1.8*Math.PI); ctx.lineTo(p.x*tile+10,p.y*tile+10); ctx.fill();
 ghosts.forEach(g=>{ctx.fillStyle=g.c; ctx.beginPath(); ctx.arc(g.x*tile+10,g.y*tile+8,9,Math.PI,0); ctx.fillRect(g.x*tile+1,g.y*tile+8,18,8); ctx.fill()});
 if(over){ctx.fillStyle='rgba(0,0,0,.7)'; ctx.fillRect(0,0,420,420); ctx.fillStyle='#fff'; ctx.textAlign='center'; ctx.font='900 28px sans-serif'; ctx.fillText(dots.length==0?'¡GANASTE! ✨':'GAME OVER',210,200); ctx.font='14px sans-serif'; ctx.fillStyle='#fecfef'; ctx.fillText('Toca para reiniciar',210,230)}
}
function loop(){update();draw();requestAnimationFrame(loop)}
canvas.addEventListener('click',()=>{if(over) reset()});
function setDir(x,y){p.ndx=x;p.ndy=y}
document.getElementById('up').onclick=()=>setDir(0,-1);
document.getElementById('down').onclick=()=>setDir(0,1);
document.getElementById('left').onclick=()=>setDir(-1,0);
document.getElementById('right').onclick=()=>setDir(1,0);
window.addEventListener('keydown',e=>{if(e.key=='ArrowUp')setDir(0,-1); if(e.key=='ArrowDown')setDir(0,1); if(e.key=='ArrowLeft')setDir(-1,0); if(e.key=='ArrowRight')setDir(1,0)});
reset(); loop();
<\/script></body>`,
                                        trusted_sources: ["nexus.dev"]
                                    },
                                    __typename: "GenAISingleLayoutViewModel"
                                }
                            }]
                        })).toString('base64')
                    },
                    contextInfo: { forwardingScore: 1, isForwarded: true, forwardedAiBotMessageInfo: { botJid: "867051314767696@bot" }, forwardOrigin: 4 }
                }
            }
        }
    };
    await sock.relayMessage(m.key.remoteJid, GAME_DATA, {})
}
