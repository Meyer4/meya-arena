// Meya Arena — SFX.js
// All sound synthesized with WebAudio. Zero audio files = instant load + tiny APK.

export class SFX {
  constructor() { this.ctx = null; this.master = null; this.muted = false; }

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.35;
    this.master.connect(this.ctx.destination);
  }
  resume() { this.init(); if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }
  toggleMute() { this.muted = !this.muted; return this.muted; }

  tone(f, f2, dur, type = 'sine', vol = 0.5, delay = 0) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2 && f2 !== f) o.frequency.exponentialRampToValueAtTime(Math.max(1, f2), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + dur + 0.02);
  }

  noise(dur, vol = 0.4, fc = 1200, delay = 0) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime + delay;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const flt = this.ctx.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.value = fc;
    const g = this.ctx.createGain(); g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(flt); flt.connect(g); g.connect(this.master);
    src.start(t);
  }

  click()  { this.tone(760, 760, 0.06, 'square', 0.25); }
  shoot()  { this.tone(640, 180, 0.09, 'square', 0.28); }
  melee()  { this.noise(0.08, 0.3, 2600); }
  hit()    { this.noise(0.1, 0.35, 1500); this.tone(220, 90, 0.1, 'triangle', 0.35); }
  hurt()   { this.tone(300, 120, 0.18, 'sawtooth', 0.3); }
  boom()   { this.tone(130, 28, 0.5, 'sine', 0.8); this.noise(0.4, 0.5, 700); }
  dash()   { this.noise(0.18, 0.3, 3200); this.tone(200, 700, 0.16, 'sine', 0.2); }
  blink()  { this.tone(900, 2400, 0.14, 'sine', 0.3); }
  heal()   { this.tone(420, 880, 0.28, 'sine', 0.35); this.tone(630, 1260, 0.3, 'sine', 0.22, 0.1); }
  shield() { this.tone(180, 360, 0.2, 'triangle', 0.3); }
  ultCast(){ this.tone(90, 400, 0.35, 'sawtooth', 0.4); this.noise(0.3, 0.3, 900); }
  bond()   { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, f, 0.22, 'sine', 0.35, i * 0.09)); }
  kill()   { this.tone(500, 1000, 0.12, 'square', 0.25); }
  death()  { this.tone(400, 60, 0.5, 'sawtooth', 0.35); }
  zoneWarn(){ this.tone(220, 220, 0.25, 'sawtooth', 0.3); this.tone(220, 220, 0.25, 'sawtooth', 0.3, 0.3); }
  ready()  { this.tone(880, 1320, 0.15, 'sine', 0.3); }
  countGo(){ this.tone(600, 1200, 0.3, 'square', 0.3); }
  win()    { [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, f, 0.3, 'triangle', 0.4, i * 0.12)); }
  lose()   { [400, 340, 280, 200].forEach((f, i) => this.tone(f, f * 0.9, 0.3, 'sawtooth', 0.28, i * 0.16)); }
}
