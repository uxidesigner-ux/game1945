/** Tiny Web Audio beeps — no asset files; unlocks after first user input. */

const STORAGE_KEY = 'vortex_strikers_sfx_muted';

let audioCtx: AudioContext | null = null;
let sfxMuted = false;

function getCtx(): AudioContext {
  if (!audioCtx) {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ??
      AudioContext;
    audioCtx = new AC();
  }
  return audioCtx;
}

export async function ensureAudioUnlocked(): Promise<void> {
  const c = getCtx();
  if (c.state === 'suspended') {
    await c.resume();
  }
}

export function setSfxMuted(muted: boolean): void {
  sfxMuted = muted;
}

export function toggleSfxMuted(): boolean {
  sfxMuted = !sfxMuted;
  return sfxMuted;
}

export function isSfxMuted(): boolean {
  return sfxMuted;
}

/** Restore mute flag from localStorage (call when entering gameplay). */
export function loadSfxPreferenceFromStorage(): void {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === '1') sfxMuted = true;
    else if (v === '0') sfxMuted = false;
  } catch {
    /* private mode / denied */
  }
}

export function persistSfxPreferenceToStorage(muted: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, muted ? '1' : '0');
  } catch {
    /* ignore */
  }
}

function tone(
  freq: number,
  durationSec: number,
  peakGain: number,
  type: OscillatorType = 'sine',
): void {
  if (sfxMuted) return;
  const c = getCtx();
  const t0 = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(peakGain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0008, t0 + durationSec);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + durationSec + 0.06);
}

export const SFX = {
  async pickupPower(): Promise<void> {
    await ensureAudioUnlocked();
    if (sfxMuted) return;
    tone(540, 0.07, 0.055);
    window.setTimeout(() => {
      if (!sfxMuted) tone(820, 0.06, 0.04, 'square');
    }, 45);
  },

  async pickupCore(): Promise<void> {
    await ensureAudioUnlocked();
    if (sfxMuted) return;
    tone(920, 0.09, 0.065);
    window.setTimeout(() => {
      if (!sfxMuted) tone(1380, 0.07, 0.038);
    }, 55);
  },

  async playerHurt(): Promise<void> {
    await ensureAudioUnlocked();
    if (sfxMuted) return;
    tone(155, 0.18, 0.09, 'sawtooth');
  },

  async bossPhase(): Promise<void> {
    await ensureAudioUnlocked();
    if (sfxMuted) return;
    tone(260, 0.14, 0.065, 'triangle');
    window.setTimeout(() => {
      if (!sfxMuted) tone(180, 0.1, 0.045, 'triangle');
    }, 70);
  },

  async bomb(): Promise<void> {
    await ensureAudioUnlocked();
    if (sfxMuted) return;
    tone(70, 0.32, 0.11, 'square');
  },

  /** One short blip per volley — keeps fire readable without noise. */
  async primaryFire(): Promise<void> {
    await ensureAudioUnlocked();
    if (sfxMuted) return;
    tone(520, 0.035, 0.028);
  },

  async chargeRelease(): Promise<void> {
    await ensureAudioUnlocked();
    if (sfxMuted) return;
    tone(340, 0.09, 0.042, 'triangle');
    window.setTimeout(() => {
      if (!sfxMuted) tone(620, 0.06, 0.028);
    }, 40);
  },
};
