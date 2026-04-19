import { useCallback, useRef } from 'react';

type FeedbackType = 'success' | 'delete' | 'tap' | 'error' | 'notification' | 'open' | 'close';

interface FeedbackSettings {
  soundEnabled?: boolean;
  hapticEnabled?: boolean;
  soundVolume?: number; // 0-1
}

// Audio context singleton (lazy)
let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.6;
    masterGain.connect(audioContext.destination);
  }
  return { ctx: audioContext, master: masterGain! };
};

// Subtle Apple-like haptic patterns (ms)
const HAPTIC_PATTERNS: Record<FeedbackType, number[]> = {
  success: [8, 24, 12],
  delete: [40],
  tap: [4],
  error: [60, 40, 60],
  notification: [12, 60, 12],
  open: [6],
  close: [4],
};

/**
 * Play a single shaped tone with envelope (ADSR-like) — sounds soft & musical.
 */
function playTone(
  ctx: AudioContext,
  dest: AudioNode,
  opts: {
    freq: number;
    duration: number;
    volume?: number;
    type?: OscillatorType;
    delay?: number;
    attack?: number;
    detune?: number;
    pitchEndRatio?: number; // multiply freq at end of duration
    filterFreq?: number;
  },
) {
  const {
    freq,
    duration,
    volume = 0.18,
    type = 'sine',
    delay = 0,
    attack = 0.005,
    detune = 0,
    pitchEndRatio,
    filterFreq,
  } = opts;
  const start = ctx.currentTime + delay;
  const end = start + duration;

  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (detune) osc.detune.setValueAtTime(detune, start);
  if (pitchEndRatio) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * pitchEndRatio), end);
  }

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0008, end);

  let node: AudioNode = gain;
  if (filterFreq) {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = 0.7;
    gain.connect(filter);
    node = filter;
  }

  osc.connect(gain);
  node.connect(dest);
  osc.start(start);
  osc.stop(end + 0.02);
}

// Soft Apple-style sound recipes
function renderSound(type: FeedbackType, ctx: AudioContext, dest: AudioNode) {
  switch (type) {
    case 'tap':
      // Soft click — short sine pop with quick decay
      playTone(ctx, dest, { freq: 880, duration: 0.05, volume: 0.08, type: 'sine', filterFreq: 4000 });
      playTone(ctx, dest, { freq: 1320, duration: 0.04, volume: 0.04, type: 'sine', delay: 0.005 });
      break;
    case 'open':
      // Rising soft swoosh (like opening a sheet)
      playTone(ctx, dest, { freq: 600, duration: 0.18, volume: 0.1, type: 'sine', pitchEndRatio: 1.4, filterFreq: 3500 });
      playTone(ctx, dest, { freq: 900, duration: 0.14, volume: 0.05, type: 'sine', delay: 0.04, pitchEndRatio: 1.3 });
      break;
    case 'close':
      // Descending soft swoosh
      playTone(ctx, dest, { freq: 700, duration: 0.16, volume: 0.09, type: 'sine', pitchEndRatio: 0.6, filterFreq: 3000 });
      break;
    case 'success': {
      // Pleasant 2-note chime (E5 → A5) — sounds like iOS "Sent"
      const E5 = 659.25;
      const A5 = 880.0;
      playTone(ctx, dest, { freq: E5, duration: 0.18, volume: 0.14, type: 'sine', filterFreq: 4500 });
      playTone(ctx, dest, { freq: E5 * 2, duration: 0.18, volume: 0.04, type: 'sine' }); // gentle harmonic
      playTone(ctx, dest, { freq: A5, duration: 0.28, volume: 0.16, type: 'sine', delay: 0.09, filterFreq: 5000 });
      playTone(ctx, dest, { freq: A5 * 2, duration: 0.28, volume: 0.04, type: 'sine', delay: 0.09 });
      break;
    }
    case 'delete':
      // Soft thud — low descending tone
      playTone(ctx, dest, { freq: 320, duration: 0.18, volume: 0.16, type: 'sine', pitchEndRatio: 0.45, filterFreq: 1200 });
      break;
    case 'error':
      // Two soft low warning beeps
      playTone(ctx, dest, { freq: 220, duration: 0.18, volume: 0.16, type: 'triangle', filterFreq: 1500 });
      playTone(ctx, dest, { freq: 196, duration: 0.22, volume: 0.16, type: 'triangle', delay: 0.18, filterFreq: 1500 });
      break;
    case 'notification': {
      // Soft "ding" — bell-like (C6 + G6)
      const C6 = 1046.5;
      const G6 = 1567.98;
      playTone(ctx, dest, { freq: C6, duration: 0.32, volume: 0.12, type: 'sine', filterFreq: 5000 });
      playTone(ctx, dest, { freq: G6, duration: 0.32, volume: 0.08, type: 'sine', delay: 0.02 });
      break;
    }
  }
}

export function useFeedback(settings?: FeedbackSettings) {
  const lastFeedbackTime = useRef<number>(0);
  const minInterval = 40;

  const getSettings = useCallback((): { soundEnabled: boolean; hapticEnabled: boolean; soundVolume: number } => {
    if (settings) {
      return {
        soundEnabled: settings.soundEnabled ?? true,
        hapticEnabled: settings.hapticEnabled ?? true,
        soundVolume: settings.soundVolume ?? 0.6,
      };
    }
    try {
      const stored = localStorage.getItem('finance_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          soundEnabled: parsed.soundEnabled ?? true,
          hapticEnabled: parsed.hapticEnabled ?? true,
          soundVolume: typeof parsed.soundVolume === 'number' ? parsed.soundVolume : 0.6,
        };
      }
    } catch {
      // ignore
    }
    return { soundEnabled: true, hapticEnabled: true, soundVolume: 0.6 };
  }, [settings]);

  const triggerHaptic = useCallback(
    (type: FeedbackType) => {
      const { hapticEnabled } = getSettings();
      if (!hapticEnabled) return;
      if (!('vibrate' in navigator)) return;
      try {
        navigator.vibrate(HAPTIC_PATTERNS[type]);
      } catch {
        // ignore
      }
    },
    [getSettings],
  );

  const playSound = useCallback(
    (type: FeedbackType) => {
      const { soundEnabled, soundVolume } = getSettings();
      if (!soundEnabled) return;
      try {
        const { ctx, master } = getAudioContext();
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => undefined);
        }
        master.gain.setValueAtTime(soundVolume, ctx.currentTime);
        renderSound(type, ctx, master);
      } catch {
        // ignore
      }
    },
    [getSettings],
  );

  const trigger = useCallback(
    (type: FeedbackType) => {
      const now = Date.now();
      if (now - lastFeedbackTime.current < minInterval) return;
      lastFeedbackTime.current = now;
      triggerHaptic(type);
      playSound(type);
    },
    [triggerHaptic, playSound],
  );

  return {
    trigger,
    triggerHaptic,
    playSound,
    success: useCallback(() => trigger('success'), [trigger]),
    delete: useCallback(() => trigger('delete'), [trigger]),
    tap: useCallback(() => trigger('tap'), [trigger]),
    error: useCallback(() => trigger('error'), [trigger]),
    notification: useCallback(() => trigger('notification'), [trigger]),
    open: useCallback(() => trigger('open'), [trigger]),
    close: useCallback(() => trigger('close'), [trigger]),
  };
}
