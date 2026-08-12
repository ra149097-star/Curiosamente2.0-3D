
let audioCtx=null, soundOn=true;
function ensureAudio(){ if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)(); if(audioCtx.state==='suspended') audioCtx.resume(); }
function tone(freq,dur,type='sine',gain=.13,delay=0){
 if(!soundOn)return; ensureAudio(); const o=audioCtx.createOscillator(),g=audioCtx.createGain();
 o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(gain,audioCtx.currentTime+delay);
 g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+delay+dur);
 o.connect(g);g.connect(audioCtx.destination);o.start(audioCtx.currentTime+delay);o.stop(audioCtx.currentTime+delay+dur);
}
function sfx(kind){
 if(kind==='hit'){tone(660,.12);tone(880,.18,'sine',.13,.10)}
 else if(kind==='error'){tone(180,.28,'sawtooth',.10)}
 else if(kind==='win'){tone(523,.18);tone(659,.18,'sine',.13,.16);tone(784,.3,'sine',.13,.32)}
}
document.addEventListener('pointerdown',ensureAudio,{once:true});

const pairs={1:{mate:2,text:'Par 1 e 2: duas cartas com a mesma imagem.'},2:{mate:1},3:{mate:4,text:'Par 3 e 4: duas cartas com a mesma imagem.'},4:{mate:3},5:{mate:6,text:'Par 5 e 6: duas cartas com a mesma imagem.'},6:{mate:5},7:{mate:8,text:'Par 7 e 8: duas cartas com a mesma imagem.'},8:{mate:7},9:{mate:10,text:'Par 9 e 10: duas cartas com a mesma imagem.'},10:{mate:9},11:{mate:12,text:'Par 11 e 12: duas cartas com a mesma imagem.'},12:{mate:11}};
const phases=[
 {title:"Primeiros sinais",cards:[1,2,3,4]},
 {title:"Memória e hipocampo",cards:[5,6,7,8]},
 {title:"Cognição e linguagem",cards:[9,10,11,12]},
 {title:"Desafio final",cards:[1,2,3,4,5,6,7,8,9,10,11,12]}
];
let phase=0,first=null,second=null,lock=false,matched=0,score=0,sound=true,installPrompt=null;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const aud={ok:new Audio('assets/audio/acerto.mp3'),bad:new Audio('assets/audio/erro.mp3'),win:new Audio('assets/audio/vitoria.mp3')};
function play(k){if(sound){aud[k].currentTime=0;aud[k].play().catch(()=>{})}}
function show(id){$$('.screen').forEach(x=>x.classList.remove('active'));$(id).classList.add('active')}
function speak(t){if(!('speechSynthesis'in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='pt-BR';u.rate=.95;speechSynthesis.speak(u)}
function introVoice(){speak('Vamos ganhar o jogo da memória! Encontre os pares do sistema nervoso e descubra relações importantes com memória, cognição e Alzheimer.')}
$('#startBtn').onclick=()=>{introVoice();setTimeout(()=>brief(),350)};
function brief(){show('#briefing');const p=phases[phase];$('#phaseHud').textContent=`Fase ${phase+1}/4`;$('#briefTitle').textContent=`Fase ${phase+1} • ${p.title}`;$('#briefText').textContent=p.brief;$('#countdown').textContent='5';speak(`Fase ${phase+1}. ${p.brief}`)}
$('#readyBtn').onclick=()=>startPhase();
async function startPhase(){
 show('#game'); const p=phases[phase];
 $('#phaseTag').textContent=`FASE ${phase+1} DE 4`; $('#phaseTitle').textContent=p.title;
 first=second=null; matched=0; lock=true;
 $('#missionText').textContent='Carregando as imagens da fase...';
 await preloadImages(p.cards);
 renderBoard(p.cards);
 $('#board').classList.add('memorize');
 let t=5; $('#timer').textContent=t;
 $('#missionText').textContent='MEMORIZE: observe todas as imagens antes que as cartas virem.';
 $('#pairInfo').innerHTML=`<strong>👀 MEMORIZE OS PARES</strong><br>As imagens fecham em <span class="big-count">${t}</span> segundos.`;
 clearInterval(window.memoryClock);
 window.memoryClock=setInterval(()=>{
   t--; $('#timer').textContent=Math.max(0,t);
   const c=document.querySelector('.big-count'); if(c)c.textContent=Math.max(0,t);
   if(t<=0){
     clearInterval(window.memoryClock); $('#board').classList.remove('memorize'); lock=false;
     $('#timer').textContent='∞'; $('#missionText').textContent='Agora encontre os pares indicados pela Dra.';
     $('#pairInfo').textContent='🧠 Encontre os pares: 1–2, 3–4, 5–6, 7–8, 9–10 e 11–12 conforme esta fase.';
     speak('Agora encontre os pares indicados pela doutora.');
   }
 },1000);
}
function preloadImages(cards){
 return Promise.all(cards.map(n=>new Promise(resolve=>{
   const im=new Image(); im.onload=resolve; im.onerror=resolve; im.src=`assets/img/${n}.png`;
 })));
}
function renderBoard(cards){const shuffled=[...cards].sort(()=>Math.random()-.5);const b=$('#board');b.innerHTML='';const n=cards.length;b.style.setProperty('--cols',n>=10?6:n>=8?4:n>=6?3:2);b.style.setProperty('--cols-mobile',n>=10?3:2);shuffled.forEach(n=>{const c=document.createElement('button');c.className='card';c.dataset.n=n;c.setAttribute('aria-label',`Carta ${n}`);c.innerHTML=`<span class="face back"></span><span class="face front"><img src="assets/img/${n}.png" alt="Imagem da carta ${n}" onerror="this.src='assets/img/11.png'"><span>${n}</span></span>`;c.onclick=()=>flip(c);c.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();flip(c)}};b.appendChild(c)})}
function flip(c){if(lock||c.classList.contains('flipped')||c.classList.contains('matched'))return;c.classList.add('flipped');if(!first){first=c;return}second=c;lock=true;const a=+first.dataset.n,b=+second.dataset.n;if(pairs[a].mate===b){setTimeout(()=>{first.classList.add('matched');second.classList.add('matched');const txt=pairs[a].text||pairs[b].text;$('#pairInfo').textContent='✓ PAR ENCONTRADO — '+txt;fx('confetti');play('ok');speak('Par encontrado. '+txt);score+=100;$('#score').textContent=score;matched+=2;first=second=null;lock=false;if(matched===phases[phase].cards.length)setTimeout(completePhase,900)},450)}else{setTimeout(()=>{first.classList.remove('flipped');second.classList.remove('flipped');$('#pairInfo').textContent='Ainda não. Observe novamente as posições e tente outra combinação.';fx('bomb');play('bad');first=second=null;lock=false},750)}}
function completePhase(){if(phase<3){score+=250;$('#score').textContent=score;phase++;show('#briefing');brief();speak('Excelente! Fase concluída. Prepare-se para o próximo desafio.')}else{play('win');show('#win');$('#finalPairs').innerHTML=Array.from({length:12},(_,i)=>`<img src="assets/img/${i+1}.png" alt="Carta ${i+1}">`).join('');speak('Vitória! Você completou as quatro fases do Neuro Memória.')}}
$('#restartBtn').onclick=()=>{phase=0;score=0;$('#score').textContent=0;show('#intro')};
$('#soundBtn').onclick=()=>{sound=!sound;$('#soundBtn').textContent=sound?'🔊':'🔇'};
$('#a11yBtn').onclick=()=>{$('#a11y').classList.add('open');$('#a11y').setAttribute('aria-hidden','false')};$('#closeA11y').onclick=()=>$('#a11y').classList.remove('open');$('#contrast').onchange=e=>document.body.classList.toggle('high-contrast',e.target.checked);$('#reduceMotion').onchange=e=>document.body.classList.toggle('reduce-motion',e.target.checked);let fs=16;$('#fontUp').onclick=()=>{fs=Math.min(22,fs+1);document.documentElement.style.setProperty('--fs',fs+'px')};$('#fontDown').onclick=()=>{fs=Math.max(14,fs-1);document.documentElement.style.setProperty('--fs',fs+'px')};$('#speakBtn').onclick=()=>speak(document.querySelector('.screen.active').innerText);
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$('#installBtn').hidden=false});$('#installBtn').onclick=async()=>{if(installPrompt){installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;$('#installBtn').hidden=true}};
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js'));

function fx(type){const d=document.createElement('div');d.className='gamefx '+type;d.textContent=type==='bomb'?'💣':'🎉 ✨ 🎊 ⭐ 🎉 ✨';document.body.appendChild(d);setTimeout(()=>d.remove(),1100)}
