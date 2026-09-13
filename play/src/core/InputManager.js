// Meya Arena — InputManager.js
// One input system for touch (joystick + drag-look) and desktop (WASD + mouse).

export class InputManager {
  constructor() {
    this.isTouch = window.matchMedia('(pointer:coarse)').matches;
    if (this.isTouch) document.body.classList.add('touch');
    this.move = { x: 0, y: 0 };       // strafe, forward (-1..1)
    this._lookDX = 0; this._lookDY = 0;
    this.sensTouch = 0.0052;
    this.sensMouse = 0.0026;
    this.keys = new Set();
    this.actions = {};
    this.playing = false;

    this.canvas = document.getElementById('game-canvas');
    this._bindKeyboard();
    this._bindJoystick();
    this._bindLook();
  }

  bindAction(name, fn) { (this.actions[name] = this.actions[name] || []).push(fn); }
  emit(name) { const l = this.actions[name]; if (l) for (const f of l) f(); }
  setPlaying(b) {
    this.playing = b;
    if (!b && document.pointerLockElement) document.exitPointerLock();
  }

  consumeLook() {
    const r = { dx: this._lookDX, dy: this._lookDY };
    this._lookDX = 0; this._lookDY = 0;
    return r;
  }

  // Merge keyboard + joystick into one move vector.
  getMove() {
    let x = this.move.x, y = this.move.y;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y += 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y -= 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;
    const l = Math.hypot(x, y);
    if (l > 1) { x /= l; y /= l; }
    return { x, y };
  }

  _bindKeyboard() {
    const down = (e) => {
      if (!this.playing) return;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      if (e.repeat) return;
      this.keys.add(e.code);
      if (e.code === 'Space') this.emit('attack');
      if (e.code === 'KeyQ' || e.code === 'Digit1') this.emit('s1');
      if (e.code === 'KeyE' || e.code === 'Digit2') this.emit('s2');
      if (e.code === 'KeyR' || e.code === 'Digit3') this.emit('ult');
      if (e.code === 'KeyT' || e.code === 'KeyF') this.emit('bond');
    };
    const up = (e) => this.keys.delete(e.code);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', () => this.keys.clear());
  }

  _bindJoystick() {
    const zone = document.getElementById('joystick-zone');
    const base = document.getElementById('joystick-base');
    const nub = document.getElementById('joystick-nub');
    let joyId = null, ox = 0, oy = 0;
    const R = 52;
    zone.addEventListener('pointerdown', (e) => {
      if (joyId !== null || !this.playing) return;
      joyId = e.pointerId; ox = e.clientX; oy = e.clientY;
      zone.setPointerCapture(e.pointerId);
      base.style.display = 'block';
      base.style.left = (ox - 62) + 'px'; base.style.top = (oy - 62) + 'px';
      nub.style.transform = 'translate(0px,0px)';
    });
    zone.addEventListener('pointermove', (e) => {
      if (e.pointerId !== joyId) return;
      let dx = e.clientX - ox, dy = e.clientY - oy;
      const l = Math.hypot(dx, dy);
      if (l > R) { dx = dx / l * R; dy = dy / l * R; }
      nub.style.transform = `translate(${dx}px,${dy}px)`;
      this.move.x = dx / R; this.move.y = -dy / R;
    });
    const end = (e) => {
      if (e.pointerId !== joyId) return;
      joyId = null; this.move.x = 0; this.move.y = 0;
      base.style.display = 'none';
    };
    zone.addEventListener('pointerup', end);
    zone.addEventListener('pointercancel', end);
  }

  _bindLook() {
    const layer = document.getElementById('look-layer');
    let lookId = null, lx = 0, ly = 0, dragging = false;

    // Touch: drag anywhere on look layer to rotate camera.
    layer.addEventListener('pointerdown', (e) => {
      if (!this.playing) return;
      if (e.pointerType === 'touch') {
        if (lookId !== null) return;
        lookId = e.pointerId; lx = e.clientX; ly = e.clientY;
        layer.setPointerCapture(e.pointerId);
      } else {
        dragging = true; lx = e.clientX; ly = e.clientY;
        // Desktop: click locks pointer for FPS-style mouse look.
        if (!this.isTouch && !document.pointerLockElement) {
          try { this.canvas.requestPointerLock(); } catch (_) { /* ignore */ }
        }
      }
    });
    layer.addEventListener('pointermove', (e) => {
      if (!this.playing) return;
      if (e.pointerType === 'touch') {
        if (e.pointerId !== lookId) return;
        this._lookDX += (e.clientX - lx) * this.sensTouch;
        this._lookDY += (e.clientY - ly) * this.sensTouch;
        lx = e.clientX; ly = e.clientY;
      } else if (dragging && !document.pointerLockElement) {
        this._lookDX += (e.clientX - lx) * this.sensMouse * 1.6;
        this._lookDY += (e.clientY - ly) * this.sensMouse * 1.6;
        lx = e.clientX; ly = e.clientY;
      }
    });
    const end = (e) => {
      if (e.pointerId === lookId) lookId = null;
      dragging = false;
    };
    layer.addEventListener('pointerup', end);
    layer.addEventListener('pointercancel', end);

    document.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement && this.playing) {
        this._lookDX += e.movementX * this.sensMouse;
        this._lookDY += e.movementY * this.sensMouse;
      }
    });
    // LMB attacks (desktop) — only when pointer is locked so menu clicks are safe.
    document.addEventListener('mousedown', (e) => {
      if (this.playing && document.pointerLockElement && e.button === 0) this.emit('attack');
    });
    document.addEventListener('contextmenu', (e) => { if (this.playing) e.preventDefault(); });
    document.addEventListener('gesturestart', (e) => e.preventDefault());
  }
}
