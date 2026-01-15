import { useCallback, useRef } from 'react';

type FeedbackType = 'success' | 'delete' | 'tap' | 'error' | 'notification';

// Audio context singleton
let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

// Haptic patterns (duration in ms)
const HAPTIC_PATTERNS: Record<FeedbackType, number[]> = {
  success: [10, 30, 10],
  delete: [50],
  tap: [5],
  error: [100, 50, 100],
  notification: [20, 100, 20],
};

// Sound configurations
const SOUND_CONFIG: Record<FeedbackType, { frequency: number; duration: number; type: OscillatorType; volume: number }> = {
  success: { frequency: 880, duration: 0.1, type: 'sine', volume: 0.08 },
  delete: { frequency: 220, duration: 0.15, type: 'triangle', volume: 0.06 },
  tap: { frequency: 600, duration: 0.03, type: 'sine', volume: 0.04 },
  error: { frequency: 180, duration: 0.2, type: 'sawtooth', volume: 0.05 },
  notification: { frequency: 523.25, duration: 0.12, type: 'sine', volume: 0.07 },
};

export function useFeedback() {
  const lastFeedbackTime = useRef<number>(0);
  const minInterval = 50; // Prevent rapid-fire feedback

  const triggerHaptic = useCallback((type: FeedbackType) => {
    if (!('vibrate' in navigator)) return;
    
    try {
      navigator.vibrate(HAPTIC_PATTERNS[type]);
    } catch (e) {
      // Silently fail if haptic not supported
    }
  }, []);

  const playSound = useCallback((type: FeedbackType) => {
    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const config = SOUND_CONFIG[type];
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.type = config.type;
      oscillator.frequency.setValueAtTime(config.frequency, ctx.currentTime);
      
      // Create envelope for smooth sound
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(config.volume, ctx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + config.duration);
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + config.duration);
      
      // For success, add a second higher note
      if (type === 'success') {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1318.5, ctx.currentTime + 0.08); // E6
        
        gain2.gain.setValueAtTime(0, ctx.currentTime + 0.08);
        gain2.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.09);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        
        osc2.start(ctx.currentTime + 0.08);
        osc2.stop(ctx.currentTime + 0.2);
      }
      
      // For delete, add descending tone
      if (type === 'delete') {
        oscillator.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + config.duration);
      }
    } catch (e) {
      // Silently fail if audio not supported
    }
  }, []);

  const trigger = useCallback((type: FeedbackType) => {
    const now = Date.now();
    if (now - lastFeedbackTime.current < minInterval) return;
    lastFeedbackTime.current = now;
    
    triggerHaptic(type);
    playSound(type);
  }, [triggerHaptic, playSound]);

  return {
    trigger,
    triggerHaptic,
    playSound,
    // Convenience methods
    success: useCallback(() => trigger('success'), [trigger]),
    delete: useCallback(() => trigger('delete'), [trigger]),
    tap: useCallback(() => trigger('tap'), [trigger]),
    error: useCallback(() => trigger('error'), [trigger]),
    notification: useCallback(() => trigger('notification'), [trigger]),
  };
}
