// Meya Arena — Music.js
// Procedural background music (WebAudio, zero files). Menu theme + battle theme.
// Step-sequencer with lookahead scheduling: cheap, no lag, tiny code.

const n2f = (m) => 440 * Math.pow(2, (m - 69) / 12);

const THEMES = {
  menu: {
    bpm: 92,
    chords: [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 55, 59]],
    bass: [33, 29, 31, 28],
    arp: [0, 1, 2, 1],
    drums: false,
  },
  battle: {
    bpm: 132,
    chords: [[45, 52, 57], [41, 48, 53], [43, 50, 55], [40, 47, 52]],
    bass: [33, 33, 45, 33, 29, 29, 41, 29, 31, 31, 43, 31, 28, 28, 40, 28],
    arp: [0, 1, 2, 1, 0, 2, 1, 2],
    drums: true,
  },
};

export class Music {
  constructor() {
    this.ctx = null; this.gain = null;
    this.muted = false; this.theme = null;
    this.disabled = false;   // demo/embed mode: never create audio
    this._timer = null; this._step = 0; this._nextT = 0;
  }

  ensure() {
    if (this.ctx || this.disabled) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.gain = this.ctx.createGain();
    this.gain.gain.value = this.muted ? 0 : 0.5;
    this.gain.connect(this.ctx.destination);
  }

  resume() { this.ensure(); if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }
  setMuted(m) { this.muted = m; if (this.gain) this.gain.gain.value = m ? 0 : 0.5; }

  start(theme) {
    if (this.disabled) return;
    this.resume();
    if (!this.ctx || this.theme === theme) return;
    this.stop();
    this.theme = theme;
    this._step = 0;
    this._nextT = this.ctx.currentTime + 0.1;
    this._timer = setInterval(() => this._schedule(), 30);
  }

  stop() {
    if (this._timer) clearInterval(this._timer);
    this._timer = null; this.theme = null;
  }

  _schedule() {
    if (!this.ctx || !this.theme) return;
    const T = THEMES[this.theme];
    const spb = 60 / T.bpm / 2;
    while (this._nextT < this.ctx.currentTime + 0.15) {
      this._playStep(T, this._step, this._nextT, spb);
      this._nextT += spb;
      this._step++;
    }
  }

  _playStep(T, step, t, spb) {
    const bar = Math.floor(step / 8) % T.chords.length;
    const chord = T.chords[bar];
    const s8 = step % 8;
    if (s8 === 0) for (const n of chord) this._note(n2f(n), t, spb * 7, 'triangle', 0.10);
    const bseq = T.bass;
    const bn = bseq[step % bseq.length];
    this._note(n2f(bn), t, spb * 0.9, this.theme === 'battle' ? 'sawtooth' : 'sine', this.theme === 'battle' ? 0.16 : 0.13);
    if (s8 % 2 === 0) {
      const an = chord[T.arp[(step / 2) % T.arp.length]] + 12;
      this._note(n2f(an), t, spb * 0.8, 'sine', 0.07);
    }
    if (T.drums) {
      if (s8 % 2 === 0) this._kick(t);
      else this._hat(t);
    }
  }

  _note(freq, t, dur, type, vol) {
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.gain);
    o.start(t); o.stop(t + dur + 0.05);
  }

  _kick(t) {
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.frequency.setValueAtTime(130, t);
    o.frequency.exponentialRampToValueAtTime(38, t + 0.12);
    g.gain.setValueAtTime(0.35, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    o.connect(g); g.connect(this.gain);
    o.start(t); o.stop(t + 0.16);
  }

  _hat(t) {
    const len = Math.floor(this.ctx.sampleRate * 0.04);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const f = this.ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000;
    const g = this.ctx.createGain(); g.gain.value = 0.08;
    src.connect(f); f.connect(g); g.connect(this.gain);
    src.start(t);
  }
}
