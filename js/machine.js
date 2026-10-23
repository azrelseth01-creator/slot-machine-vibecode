/* ================= DOM ================= */
const $ = id => document.getElementById(id);
const drum = $('drum'), blurwrap = $('blurwrap'), ticket = $('ticket');
const pullBtn = $('pullBtn'), hint = $('hint'), cabinet = $('cabinet');
const ROW = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--row')) || 84;
const reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

// marquee bulbs
const bulbs = [];
['bulbsTop','bulbsBot'].forEach(id => {
  const el = $(id);
  for(let i=0;i<14;i++){ const b = document.createElement('i'); b.className='bulb'; el.appendChild(b); bulbs.push(b); }
});
let bulbMode = 'idle', bulbTick = 0;
setInterval(() => {
  bulbTick++;
  const fast = bulbMode === 'spin' || bulbMode === 'win';
  bulbs.forEach((b,i) => {
    let on;
    if(bulbMode === 'win') on = (bulbTick % 2 === 0);
    else on = ((i + bulbTick * (fast ? 2 : 1)) % 3 === 0);
    b.classList.toggle('on', on);
  });
}, 130);

function cellHTML(it){
  return `<div class="cell ${it.cat}"><span class="g">${GLYPH[it.cat]}</span><div class="t"><strong>${it.title}</strong><em>${LABEL[it.cat]}</em></div></div>`;
}

/* ================= 3D REEL DRUM ================= */
const N = 16, STEP = 360 / N;
const faces = [], faceItems = [], refreshed = new Array(N).fill(false);
for(let i=0;i<N;i++){
  const d = document.createElement('div'); d.className = 'face';
  const it = pick(ALL); faceItems.push(it); d.innerHTML = cellHTML(it);
  drum.appendChild(d); faces.push(d);
}
let theta = 0, frontIndex = 0, radius = 200;

function renderDrum(th, prot){
  drum.style.transform = `translateZ(${-radius}px) rotateX(${-th}deg)`;
  for(let i=0;i<N;i++){
    const net = (((i*STEP - th) % 360) + 360) % 360;
    const a = net > 180 ? net - 360 : net;
    const s = (1 - Math.cos(a * Math.PI/180)) * 0.55;
    faces[i].style.setProperty('--s', s.toFixed(3));
    if(prot){                                           // swap content while a face is hidden behind the drum
      if(net > 140 && net < 220){
        if(!refreshed[i] && !prot.has(i)){
          refreshed[i] = true; faceItems[i] = pick(ALL); faces[i].innerHTML = cellHTML(faceItems[i]);
        }
      } else if(net < 110 || net > 250) refreshed[i] = false;
    }
  }
}
function layoutDrum(){
  const row = ROW();
  radius = (row/2) / Math.tan(Math.PI/N);
  faces.forEach((f,i) => { f.style.transform = `rotateX(${i*STEP}deg) translateZ(${radius}px)`; });
  renderDrum(theta);
}
layoutDrum();
window.addEventListener('resize', layoutDrum);

/* ================= STATE ================= */
let spinning = false, pulls = 0, last = null;
const history = [];

function chooseResult(){
  let r;
  do { const c = pick(CATS); r = pick(IDEAS[c].map(([title,blurb,prompt]) => ({cat:c,title,blurb,prompt}))); }
  while(last && r.title === last.title);
  return r;
}

/* ================= SPIN ================= */
function spin(){
  if(spinning) return;
  ensureAudio();
  spinning = true; pullBtn.disabled = true; hint.style.display = 'none';
  bulbMode = 'spin'; duck(true);
  ticket.classList.add('hidden');

  const result = chooseResult();
  const k = 4 + Math.floor(Math.random()*9);               // 4..12 faces ahead keeps neighbours off-screen
  const D = 3*N + k;
  const t = (frontIndex + k) % N;
  const prot = new Set([t, (t+1)%N, (t-1+N)%N]);
  faceItems[t] = result; faces[t].innerHTML = cellHTML(result);
  [(t+1)%N, (t-1+N)%N].forEach(i => { faceItems[i] = pick(ALL); faces[i].innerHTML = cellHTML(faceItems[i]); });

  const th0 = theta, th1 = th0 + D*STEP;
  const dur = 4800 + Math.random()*900;
  const t0 = performance.now();
  let lastIdx = Math.floor((th0 + STEP/2) / STEP), lastTick = 0;
  const ease = p => 1 - Math.pow(1 - p, 4);

  function frame(now){
    const p = Math.min(1, (now - t0) / dur);
    theta = th0 + (th1 - th0) * ease(p);
    renderDrum(theta, prot);
    const idx = Math.floor((theta + STEP/2) / STEP);
    if(idx !== lastIdx){
      lastIdx = idx;
      if(now - lastTick > 28){ lastTick = now; sfx.tick(0.85 + Math.random()*0.3); }
    }
    const speed = Math.pow(1 - p, 3);
    blurwrap.style.filter = speed > 0.2 ? `blur(${((speed-0.2)*7).toFixed(1)}px)` : 'none';
    if(p < 1) requestAnimationFrame(frame);
    else settle(t, th1, result);
  }
  requestAnimationFrame(frame);
}

function settle(t, th1, result){
  blurwrap.style.filter = 'none';
  sfx.thud();
  const t0 = performance.now(), Dm = 420;
  (function bounce(now){
    const p = Math.min(1, (now - t0) / Dm);
    theta = th1 + Math.sin(p * Math.PI * 2) * 3.5 * (1 - p);
    renderDrum(theta);
    if(p < 1) requestAnimationFrame(bounce);
    else {
      frontIndex = t; theta = t * STEP;
      renderDrum(theta);
      reveal(result);
    }
  })(performance.now());
}

function reveal(r){
  last = r; pulls++;
  history.unshift(r); if(history.length > 6) history.pop();
  bulbMode = 'win';
  sfx.bell(); sfx.win(); sfx.coins();
  cabinet.classList.remove('shake'); void cabinet.offsetWidth; cabinet.classList.add('shake');

  $('tNo').textContent = 'TICKET №' + String(pulls).padStart(4,'0');
  const b = $('tBadge'); b.textContent = LABEL[r.cat]; b.className = 'badge ' + r.cat;
  $('tTitle').textContent = r.title;
  $('tBlurb').textContent = r.blurb;
  $('tPrompt').textContent = 'Build "' + r.title + '" as a single-page website I can deploy on Vercel. ' + r.prompt + ' Use a warm golden-brown, wood-paneled 1971 look. Keep it to one HTML file with no build step, and make it work on mobile.';
  ticket.classList.toggle('is-rainbow', r.cat === 'rainbow');
  ticket.classList.remove('hidden','print'); void ticket.offsetWidth; ticket.classList.add('print');
  setTimeout(() => ticket.scrollIntoView({behavior:'smooth', block:'center'}), 250);

  renderHistory();
  setTimeout(() => { bulbMode = 'idle'; }, 2600);
  setTimeout(() => duck(false), 1200);
  spinning = false; pullBtn.disabled = false;
}

function renderHistory(){
  $('history').innerHTML = history.map(h => `<li><span>${h.title}</span><span>${LABEL[h.cat]}</span></li>`).join('');
}

