export const handler = {}
handler.name = 'pong'
handler.alias = ['pingpong']
handler.category = 'Fun'
handler.exec = async (sock, m) => {
const GAME_DATA = {
  messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
  botForwardedMessage: {
    message: {
      richResponseMessage: {
        messageType: 1,
        submessages: [{ messageType: 2, messageText: "Anubis Pong" }],
        unifiedResponse: {
          data: Buffer.from(JSON.stringify({
            response_id: "anubis-pong-easy",
            sections: [{
              view_model: {
                primitive: {
                  __typename: "GenAIaeacdsnwHtmlPrimitive",
                  payload: `<style>*{-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none}body{margin:0;background:#111;font-family:Quicksand,sans-serif;color:#fff;touch-action:none}.btn{background:linear-gradient(135deg,#00f2ff,#3a7bd5);border:none;color:#fff;border-radius:16px;font-weight:800;font-size:18px;box-shadow:0 8px 20px rgba(0,242,255,.3);padding:14px}</style><body><div style="width:100%;max-width:520px;margin:auto;padding:16px;box-sizing:border-box"><div style="background:#1e1e1e;border:2px solid rgba(255,255,255,0.1);border-radius:28px;padding:16px;box-shadow:0 12px 40px rgba(0,0,0,0.5)"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><div><div style="font-size:11px;color:#00f2ff;letter-spacing:2px;font-weight:900">ANUBIS ARCADE</div><div style="font-size:22px;font-weight:800">PONG EASY 🏓</div></div><div style="display:flex;gap:10px"><div style="background:rgba(255,255,255,0.08);padding:6px 14px;border-radius:20px"><span id="scoreL" style="font-size:20px;font-weight:800">0</span></div><div style="background:rgba(255,255,255,0.08);padding:6px 14px;border-radius:20px"><span id="scoreR" style="font-size:20px;font-weight:800">0</span></div></div></div><div style="position:relative;width:100%;aspect-ratio:4/3;background:#000;border-radius:18px;overflow:hidden"><canvas id="g" width="600" height="450" style="width:100%;height:100%;display:block"></canvas></div><div style="margin-top:12px;text-align:center;font-size:13px;color:#aaa">Desliza para mover tu paleta izquierda</div></div></div><script>
const c=document.getElementById('g'),x=c.getContext('2d'),scoreL=document.getElementById('scoreL'),scoreR=document.getElementById('scoreR');
let W=c.width,H=c.height;
let paddleH=90,paddleW=12;
let player={x:20,y:H/2-paddleH/2,score:0}, cpu={x:W-20-paddleW,y:H/2-paddleH/2,score:0,vy:0};
let ball={x:W/2,y:H/2,vx:4.5,vy:3,r:10};
let audioCtx=null;let cpuSpeed=3.5;let cpuError=0;
function snd(t){if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();let o=audioCtx.createOscillator(),g=audioCtx.createGain();o.connect(g);g.connect(audioCtx.destination);if(t=='hit'){o.frequency.setValueAtTime(600,audioCtx.currentTime);g.gain.setValueAtTime(0.1,audioCtx.currentTime);g.gain.linearRampToValueAtTime(0.01,audioCtx.currentTime+0.1);o.start();o.stop(audioCtx.currentTime+0.1)}else if(t=='goal'){o.frequency.setValueAtTime(200,audioCtx.currentTime);o.frequency.linearRampToValueAtTime(50,audioCtx.currentTime+0.3);g.gain.setValueAtTime(0.2,audioCtx.currentTime);g.gain.linearRampToValueAtTime(0.01,audioCtx.currentTime+0.3);o.start();o.stop(audioCtx.currentTime+0.3)}}
function resetBall(dir){ball.x=W/2;ball.y=H/2;ball.vx=4.5*dir;ball.vy=(Math.random()*6-3);cpuError=(Math.random()*120-60);if(Math.random()<0.3)cpuSpeed=2.5+Math.random()*1.5;else cpuSpeed=3.5;}
function update(){ball.x+=ball.vx;ball.y+=ball.vy;if(ball.y-ball.r<0||ball.y+ball.r>H){ball.vy*=-1;snd('hit')}let p = ball.vx<0?player:cpu;if(ball.x-ball.r < p.x+paddleW && ball.x+ball.r > p.x && ball.y+ball.r > p.y && ball.y-ball.r < p.y+paddleH){ball.vx*=-1.05;let hitPos=(ball.y-(p.y+paddleH/2))/(paddleH/2);ball.vy=hitPos*5;if(p===player)ball.x=player.x+paddleW+ball.r;else ball.x=cpu.x-ball.r;snd('hit');if(Math.abs(ball.vx)>10)ball.vx=10*Math.sign(ball.vx)}if(ball.vx>0){let target=(ball.y+cpuError)-cpu.y-paddleH/2;if(Math.abs(target)>6){cpu.vy+=(target>0?cpuSpeed:-cpuSpeed)*0.12}cpu.vy*=0.88;cpu.y+=cpu.vy;if(cpu.vy>cpuSpeed)cpu.vy=cpuSpeed;if(cpu.vy<-cpuSpeed)cpu.vy=-cpuSpeed;}else{cpu.vy*=0.92;cpu.y+=cpu.vy*0.5}if(cpu.y<0)cpu.y=0;if(cpu.y+paddleH>H)cpu.y=H-paddleH;if(ball.x<0){cpu.score++;scoreR.textContent=cpu.score;snd('goal');resetBall(1)}if(ball.x>W){player.score++;scoreL.textContent=player.score;snd('goal');resetBall(-1)}}
function draw(){x.fillStyle='#0a0a0a';x.fillRect(0,0,W,H);x.strokeStyle='rgba(255,255,255,0.15)';x.setLineDash([10,10]);x.beginPath();x.moveTo(W/2,0);x.lineTo(W/2,H);x.stroke();x.setLineDash([]);x.fillStyle='#fff';x.fillRect(player.x,player.y,paddleW,paddleH);x.fillRect(cpu.x,cpu.y,paddleW,paddleH);x.beginPath();x.arc(ball.x,ball.y,ball.r,0,Math.PI*2);x.fill();}function loop(){update();draw();requestAnimationFrame(loop)}
let dragging=false;function move(y){let rect=c.getBoundingClientRect();let my=(y-rect.top)*(H/rect.height);player.y=my-paddleH/2;if(player.y<0)player.y=0;if(player.y+paddleH>H)player.y=H-paddleH}
c.addEventListener('touchstart',e=>{dragging=true;move(e.touches[0].clientY)});c.addEventListener('touchmove',e=>{if(dragging)move(e.touches[0].clientY);e.preventDefault()},{passive:false});c.addEventListener('touchend',()=>dragging=false);c.addEventListener('mousemove',e=>{if(e.buttons===1)move(e.clientY)});c.addEventListener('mousedown',e=>move(e.clientY));
resetBall(1);loop();
<\/script></body>`,
                  trusted_sources: ["anubis.bot"]
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
