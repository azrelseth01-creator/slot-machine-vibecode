/* ================= TICKET BUTTONS ================= */
$('againBtn').addEventListener('click', () => { window.scrollTo({top:0, behavior:'smooth'}); setTimeout(autoPull, 450); });
$('copyBtn').addEventListener('click', async () => {
  const txt = $('tPrompt').textContent, btn = $('copyBtn');
  try { await navigator.clipboard.writeText(txt); }
  catch { const ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); }
  sfx.pop(); btn.textContent = 'COPIED ✓'; setTimeout(() => btn.textContent = 'COPY PROMPT', 1600);
});

/* ================= SOUND + MUSIC CONTROLS ================= */
$('sfxBtn').addEventListener('click', e => {
  muted = !muted; e.currentTarget.textContent = 'SFX: ' + (muted ? 'OFF' : 'ON');
  e.currentTarget.setAttribute('aria-pressed', String(muted));
  if(!muted) sfx.pop();
});
// first tap starts the jazz; later taps toggle it
function toggleMusic(){
  if(!M.on) setMusic(true);
  else if(!M.started) ensureAudio();
  else setMusic(false);
}
$('musicBtn').addEventListener('click', toggleMusic);
const phono = $('phono');
phono.addEventListener('click', toggleMusic);
phono.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); toggleMusic(); } });

// any first gesture unlocks audio and starts the jazz (except the music toggles themselves)
['pointerdown','touchend','click','keydown'].forEach(ev =>
  window.addEventListener(ev, e => {
    if(e.target && e.target.closest && e.target.closest('[data-music-toggle]')) return;
    ensureAudio();
  }, {passive:true})
);
