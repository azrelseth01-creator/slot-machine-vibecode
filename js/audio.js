/* ================= AUDIO CORE ================= */
let actx = null, muted = false;
const AC = window.AudioContext || window.webkitAudioContext;
function ensureAudio(){
  if(!AC) return null;
  if(!actx) actx = new AC();
  if(actx.state === 'suspended') actx.resume();
  if(M.on && !M.started) startMusic();
  return actx;
}
function tone(freq, dur=0.1, type='square', vol=0.12, delay=0, slide=null){
  if(muted) return; const c = ensureAudio(); if(!c) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if(slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t); o.stop(t + dur + 0.05);
}
function noise(dur=0.15, vol=0.2, lp=800, delay=0){
  if(muted) return; const c = ensureAudio(); if(!c) return;
  const t = c.currentTime + delay;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for(let i=0;i<len;i++) d[i] = (Math.random()*2-1) * (1 - i/len);
  const s = c.createBufferSource(); s.buffer = buf;
  const f = c.createBiquadFilter(); f.type='lowpass'; f.frequency.value = lp;
  const g = c.createGain(); g.gain.value = vol;
  s.connect(f).connect(g).connect(c.destination);
  s.start(t);
}
const sfx = {
  tick(p=1){ tone(900*p, 0.035, 'square', 0.06); noise(0.02, 0.05, 3000); },
  clunk(){ tone(120, 0.18, 'sine', 0.35, 0, 50); noise(0.12, 0.25, 500); },
  ratchet(){ for(let i=0;i<6;i++){ tone(500+i*60, 0.03, 'square', 0.05, i*0.03); } },
  spring(){ tone(260, 0.35, 'triangle', 0.12, 0, 520); },
  thud(){ tone(90, 0.25, 'sine', 0.4, 0, 40); noise(0.2, 0.3, 400); },
  bell(){ [880,1318,1760].forEach((f,i)=>tone(f, 1.1, 'sine', 0.13/(i+1), 0.02)); },
  win(){ [523,659,784,1047,1319].forEach((f,i)=>tone(f, 0.22, 'triangle', 0.16, i*0.09)); },
  coins(){ for(let i=0;i<9;i++){ const b=1500+Math.random()*900; tone(b, 0.07, 'square', 0.05, 0.5+i*0.07+Math.random()*0.03); } },
  pop(){ tone(700, 0.08, 'sine', 0.15, 0, 1200); }
};

/* ================= JAZZ ENGINE (all synthesized, loops forever) ================= */
const BPM = 112, BEAT = 60 / BPM, SW = 0.64;      // swung eighths
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const CH = {
  Dm7:  { root:38, bass:[38,41,45,48], voice:[53,57,60,64], pcs:[2,5,9,0],  scale:[2,4,5,7,9,11,0] },
  G7:   { root:43, bass:[43,47,50,53], voice:[53,59,62,64], pcs:[7,11,2,5], scale:[7,9,11,0,2,4,5] },
  Cmaj7:{ root:36, bass:[36,40,43,47], voice:[52,55,59,62], pcs:[0,4,7,11], scale:[0,2,4,5,7,9,11] },
  A7:   { root:45, bass:[45,49,52,55], voice:[55,61,64,66], pcs:[9,1,4,7],  scale:[9,11,1,2,4,6,7] }
};
const PROG = [['Dm7'],['G7'],['Cmaj7'],['A7'],['Dm7'],['G7'],['Cmaj7'],['Cmaj7','A7']];
const COMP = [[0,3],[3],[3,7],[0,5],[2,5,7],[1,4],[0,3,6]];
const chordFor = (bar, beat) => { const p = PROG[bar % 8]; return CH[p.length === 1 ? p[0] : (beat < 2 ? p[0] : p[1])]; };

const M = { on:true, started:false, timer:null, n:0, t0:0, out:null, bus:null, noiseBuf:null,
            comp:[0,3], ducked:false, lead:{note:72,left:0,rest:8,hold:0} };

function satCurve(k){
  const n = 1024, c = new Float32Array(n);
  for(let i=0;i<n;i++){ const x = i*2/n - 1; c[i] = (1+k)*x/(1+k*Math.abs(x)); }
  return c;
}
function buildMusicBus(c){
  // noise buffer shared by cymbals + vinyl crackle
  const len = c.sampleRate * 2;
  M.noiseBuf = c.createBuffer(1, len, c.sampleRate);
  const d = M.noiseBuf.getChannelData(0);
  for(let i=0;i<len;i++) d[i] = Math.random()*2 - 1;

  const bus = c.createGain(); bus.gain.value = 0.6;
  const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 60;
  const sh = c.createWaveShaper(); sh.curve = satCurve(1.4); sh.oversample = '2x';
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5200; lp.Q.value = 0.4;
  const out = c.createGain(); out.gain.value = 0;
  const comp = c.createDynamicsCompressor();
  comp.threshold.value = -20; comp.ratio.value = 4; comp.attack.value = 0.01; comp.release.value = 0.2;

  const dl = c.createDelay(1); dl.delayTime.value = 0.19;
  const fb = c.createGain(); fb.gain.value = 0.22;
  const wet = c.createGain(); wet.gain.value = 0.2;

  bus.connect(hp); hp.connect(sh); sh.connect(lp); lp.connect(out);
  lp.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(out);
  out.connect(comp); comp.connect(c.destination);

  // constant record hiss
  const hiss = c.createBufferSource(); hiss.buffer = M.noiseBuf; hiss.loop = true;
  const hf = c.createBiquadFilter(); hf.type = 'highpass'; hf.frequency.value = 4500;
  const hg = c.createGain(); hg.gain.value = 0.012;
  hiss.connect(hf); hf.connect(hg); hg.connect(out); hiss.start();

  M.bus = bus; M.out = out;
}

function burst(t, vol, dec, type, freq, q=0.7, dest){
  const c = actx;
  const src = c.createBufferSource(); src.buffer = M.noiseBuf;
  const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dec);
  src.connect(f); f.connect(g); g.connect(dest || M.bus);
  src.start(t, Math.random()*1.5, dec + 0.05);
}
function vinylPop(t){ burst(t, 0.05 + Math.random()*0.09, 0.004 + Math.random()*0.004, 'highpass', 1800, 0.7, M.out); }
function ride(t, v){ burst(t, v, 0.34, 'highpass', 6800); burst(t, v*0.5, 0.5, 'bandpass', 9500, 2); }
function chick(t){ burst(t, 0.07, 0.06, 'highpass', 8500); }
function brush(t, v){ burst(t, v, 0.14, 'bandpass', 2300, 0.9); }
function kick(t, v){
  const c = actx, o = c.createOscillator(), g = c.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(75, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.16);
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
  o.connect(g); g.connect(M.bus); o.start(t); o.stop(t + 0.25);
}
function bassNote(m, t){
  const c = actx, f = mtof(m);
  const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
  const o2 = c.createOscillator(); o2.type = 'sine'; o2.frequency.value = f*2;
  const g2 = c.createGain(); g2.gain.value = 0.35;
  const lp = c.createBiquadFilter(); lp.type = 'lowpass';
  lp.frequency.setValueAtTime(950, t); lp.frequency.exponentialRampToValueAtTime(280, t + 0.3);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.34, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + BEAT*0.95);
  o.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(g); g.connect(M.bus);
  o.start(t); o2.start(t); o.stop(t + BEAT); o2.stop(t + BEAT);
}
function pianoNote(m, t, dur, vol){
  const c = actx, f = mtof(m);
  const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f;
  const o2 = c.createOscillator(); o2.type = 'triangle'; o2.frequency.value = f*2.003;
  const g2 = c.createGain(); g2.gain.value = 0.3;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); o2.connect(g2); g2.connect(g); g.connect(M.bus);
  o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
}
function leadNote(m, t, dur, vol){
  const c = actx, f = mtof(m);
  const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
  const lfo = c.createOscillator(); lfo.frequency.value = 5.2;
  const lg = c.createGain();
  lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f*0.012, t + Math.min(dur*0.6, 0.25));
  lfo.connect(lg); lg.connect(o.frequency);
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = Math.min(2400, f*4); lp.Q.value = 2;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.045);
  g.gain.setValueAtTime(vol*0.85, t + Math.max(0.05, dur*0.7));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.08);
  o.connect(lp); lp.connect(g); g.connect(M.bus);
  o.start(t); lfo.start(t); o.stop(t + dur + 0.15); lfo.stop(t + dur + 0.15);
}

function bassPitch(bar, beat){
  const cur = chordFor(bar, beat);
  const nBar = beat === 3 ? (bar+1)%8 : bar, nBeat = (beat+1)%4;
  const nxt = chordFor(nBar, nBeat);
  if(nxt !== cur) return nxt.root + (Math.random() < 0.5 ? 1 : -1);        // chromatic approach
  const prev = beat === 0 ? chordFor((bar+7)%8, 3) : chordFor(bar, beat-1);
  if(prev !== cur) return cur.root;                                        // chord's first beat
  return cur.bass[1 + Math.floor(Math.random()*3)];
}
function scaleNotes(ch){
  const out = [];
  for(let m=60; m<=86; m++) if(ch.scale.includes(m%12)) out.push(m);
  return out;
}
function nearestIdx(arr, v){ let bi=0, bd=1e9; arr.forEach((x,i)=>{ const d=Math.abs(x-v); if(d<bd){bd=d;bi=i;} }); return bi; }
function leadStep(bar, e, t){
  const L = M.lead;
  if(L.hold > 0){ L.hold--; return; }
  if(L.rest > 0){ L.rest--; return; }
  if(L.left <= 0) L.left = 3 + Math.floor(Math.random()*6);
  const ch = chordFor(bar, Math.floor(e/2));
  const notes = scaleNotes(ch);
  let idx = nearestIdx(notes, L.note);
  let mv = pick([-3,-2,-1,-1,0,1,1,2,3]);
  if(L.note > 80) mv = -Math.abs(mv) - 1;
  if(L.note < 64) mv = Math.abs(mv) + 1;
  idx = Math.max(0, Math.min(notes.length-1, idx + mv));
  let m = notes[idx];
  if(e % 2 === 0 && Math.random() < 0.6){                                    // land on chord tones on the beat
    const tones = []; for(let x=60;x<=86;x++) if(ch.pcs.includes(x%12)) tones.push(x);
    m = tones[nearestIdx(tones, m)];
  }
  L.note = m;
  const steps = Math.random() < 0.7 ? 1 : (Math.random() < 0.6 ? 2 : 4);
  L.hold = steps - 1; L.left--;
  leadNote(m, t, steps*BEAT*0.5*0.92, 0.07);
  if(L.left <= 0) L.rest = 2 + Math.floor(Math.random()*7);
}

const stepTime = n => M.t0 + Math.floor(n/8)*4*BEAT + (Math.floor((n%8)/2) + ((n%2) ? SW : 0)) * BEAT;

function playStep(n, t){
  const bar = Math.floor(n/8) % 8, e = n % 8, beat = Math.floor(e/2);
  // drums
  if([0,2,4,6].includes(e)) ride(t, 0.05 + Math.random()*0.01);
  if(e === 3 || e === 7) ride(t, 0.03);
  if(e === 2 || e === 6) chick(t);
  if([0,2,4,6].includes(e)) kick(t, 0.1);
  if((e === 5 || e === 7) && Math.random() < 0.25) brush(t, 0.05);
  if(e === 3 && Math.random() < 0.12) brush(t, 0.07);
  // bass (quarters)
  if(e % 2 === 0) bassNote(bassPitch(bar, beat), t);
  // piano comping
  if(e === 0) M.comp = pick(COMP);
  if(M.comp.includes(e)){
    const ch = chordFor(bar, beat);
    ch.voice.forEach((m,i)=> pianoNote(m, t + i*0.012 + Math.random()*0.006, e===0 ? 0.9 : 0.55, 0.05 + Math.random()*0.015));
  }
  // melody
  leadStep(bar, e, t);
  // vinyl pops
  if(Math.random() < 0.18) vinylPop(t + Math.random()*0.12);
}
function schedule(){
  if(!actx) return;
  while(stepTime(M.n) < actx.currentTime + 1.2){ playStep(M.n, stepTime(M.n)); M.n++; }
}
function startScheduler(){
  M.n = 0; M.t0 = actx.currentTime + 0.15;
  clearInterval(M.timer); M.timer = setInterval(schedule, 200); schedule();
}
function applyMusicGain(){
  if(!M.out) return;
  const target = M.on ? (M.ducked ? 0.55 : 1) : 0;
  M.out.gain.setTargetAtTime(target, actx.currentTime, 0.15);
}
function startMusic(){
  if(!actx || M.started) return;
  M.started = true;
  buildMusicBus(actx);
  startScheduler(); applyMusicGain();
  document.body.classList.add('music-started');
}
function setMusic(on){
  M.on = on;
  const b = document.getElementById('musicBtn');
  b.textContent = 'MUSIC: ' + (on ? 'ON' : 'OFF'); b.setAttribute('aria-pressed', String(!on));
  if(on){
    ensureAudio();
    if(M.started && !M.timer) startScheduler();
    applyMusicGain();
  } else {
    applyMusicGain();
    setTimeout(()=>{ if(!M.on){ clearInterval(M.timer); M.timer = null; } }, 900);
  }
}
function duck(on){ M.ducked = on; applyMusicGain(); }

