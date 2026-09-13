// Meya Arena — Engine.js
// Three.js renderer/scene/camera + Adaptive Performance Engine (no-lag system).
import * as THREE from 'three';
import { TIERS, TIER_SETTINGS, CAM_DIST } from './constants.js';

export class Engine {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b1026);
    this.scene.fog = new THREE.Fog(0x0b1026, 42, 150);

    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 400);

    // Twilight arena lighting: cheap hemisphere + one shadow-casting sun.
    this.scene.add(new THREE.HemisphereLight(0x8ab4ff, 0x1a1033, 0.95));
    this.sun = new THREE.DirectionalLight(0xfff1d6, 1.6);
    this.sun.position.set(30, 48, 18);
    this.sun.castShadow = true;
    this.sun.shadow.camera.left = -65; this.sun.shadow.camera.right = 65;
    this.sun.shadow.camera.top = 65; this.sun.shadow.camera.bottom = -65;
    this.sun.shadow.camera.far = 140;
    this.sun.shadow.bias = -0.0008;
    this.scene.add(this.sun);
    const rim = new THREE.DirectionalLight(0xec4899, 0.5);
    rim.position.set(-25, 20, -30);
    this.scene.add(rim);

    this.isTouchDevice = window.matchMedia('(pointer:coarse)').matches;
    this.mode = 'auto';                    // 'auto' | 'high' | 'medium' | 'low'
    this.tier = this.isTouchDevice ? 'medium' : 'high';
    this.onTierChange = null;
    this.applyTier(this.tier);

    this._fpsAcc = 0; this._fpsN = 0; this._fpsTimer = 0; this._goodWindows = 0;
    this.shakeT = 0;
    this._camInit = false;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  setQualityMode(mode) {
    this.mode = mode;
    if (mode !== 'auto') this.applyTier(mode);
    else this.applyTier(this.isTouchDevice ? 'medium' : 'high');
  }

  applyTier(tier) {
    this.tier = tier;
    const s = TIER_SETTINGS[tier];
    const dpr = Math.min(window.devicePixelRatio || 1, s.pixelRatioCap);
    this.renderer.setPixelRatio(dpr);
    this.sun.castShadow = s.shadows;
    const sh = this.sun.shadow;
    if (sh.mapSize.x !== s.shadowSize) {
      sh.mapSize.set(s.shadowSize, s.shadowSize);
      if (sh.map) { sh.map.dispose(); sh.map = null; }
    }
    this.resize();
    if (this.onTierChange) this.onTierChange(tier, s);
  }

  // Auto mode: watch real FPS, step quality up/down. This is the "no lag" magic.
  updateAuto(dt, fps) {
    if (this.mode !== 'auto') return;
    this._fpsAcc += fps; this._fpsN++; this._fpsTimer += dt;
    if (this._fpsTimer < 2.5) return;
    const avg = this._fpsAcc / Math.max(1, this._fpsN);
    const i = TIERS.indexOf(this.tier);
    if (avg < 38 && i > 0) { this.applyTier(TIERS[i - 1]); this._goodWindows = 0; }
    else if (avg > 57 && i < TIERS.length - 1) {
      this._goodWindows++;
      if (this._goodWindows >= 2) { this.applyTier(TIERS[i + 1]); this._goodWindows = 0; }
    } else this._goodWindows = 0;
    this._fpsAcc = 0; this._fpsN = 0; this._fpsTimer = 0;
  }

  shake(amt) { this.shakeT = Math.min(0.6, this.shakeT + amt); }

  // Third-person follow camera (Free Fire / PUBG style).
  updateCamera(target, yaw, pitch, dt, snap = false) {
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    // Over-shoulder offset
    const rx = Math.cos(yaw), rz = -Math.sin(yaw);
    const tx = target.x + rx * 1.1, ty = target.y + 1.7, tz = target.z + rz * 1.1;
    const px = tx + Math.sin(yaw) * cp * CAM_DIST;
    const py = ty + sp * CAM_DIST + 1.2;
    const pz = tz + Math.cos(yaw) * cp * CAM_DIST;
    const k = snap ? 1 : 1 - Math.pow(0.0001, dt);
    this.camera.position.x += (px - this.camera.position.x) * k;
    this.camera.position.y += (Math.max(1.4, py) - this.camera.position.y) * k;
    this.camera.position.z += (pz - this.camera.position.z) * k;
    if (this.shakeT > 0) {
      this.shakeT = Math.max(0, this.shakeT - dt * 1.8);
      const s = this.shakeT * 0.5;
      this.camera.position.x += (Math.random() - 0.5) * s;
      this.camera.position.y += (Math.random() - 0.5) * s;
    }
    this.camera.lookAt(tx, ty, tz);
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  render() { this.renderer.render(this.scene, this.camera); }
}
