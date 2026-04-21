import { useCallback, useEffect, useRef } from 'react';

interface TiltOptions {
  /** Maximum rotation in degrees (default 8) */
  max?: number;
  /** Smoothing factor 0..1 (default 0.18) */
  smooth?: number;
  /** Enable / disable */
  enabled?: boolean;
}

/**
 * Apple Vision Pro-style tilt + cursor-tracked specular highlight.
 * Updates CSS variables --mx, --my, --rx, --ry, --tilt-active on the target element.
 * Pair with `data-tilt="true"` styles defined in index.css.
 */
export function useTilt<T extends HTMLElement = HTMLDivElement>({
  max = 8,
  smooth = 0.18,
  enabled = true,
}: TiltOptions = {}) {
  const ref = useRef<T | null>(null);
  const targetRX = useRef(0);
  const targetRY = useRef(0);
  const currentRX = useRef(0);
  const currentRY = useRef(0);
  const targetMX = useRef(50);
  const targetMY = useRef(50);
  const currentMX = useRef(50);
  const currentMY = useRef(50);
  const rafId = useRef<number | null>(null);
  const active = useRef(false);

  const tick = useCallback(() => {
    const el = ref.current;
    if (!el) {
      rafId.current = null;
      return;
    }
    currentRX.current += (targetRX.current - currentRX.current) * smooth;
    currentRY.current += (targetRY.current - currentRY.current) * smooth;
    currentMX.current += (targetMX.current - currentMX.current) * smooth;
    currentMY.current += (targetMY.current - currentMY.current) * smooth;

    el.style.setProperty('--rx', `${currentRX.current.toFixed(2)}deg`);
    el.style.setProperty('--ry', `${currentRY.current.toFixed(2)}deg`);
    el.style.setProperty('--mx', `${currentMX.current.toFixed(2)}%`);
    el.style.setProperty('--my', `${currentMY.current.toFixed(2)}%`);

    const dx = Math.abs(targetRX.current - currentRX.current);
    const dy = Math.abs(targetRY.current - currentRY.current);
    if (dx > 0.05 || dy > 0.05 || active.current) {
      rafId.current = requestAnimationFrame(tick);
    } else {
      rafId.current = null;
    }
  }, [smooth]);

  const start = useCallback(() => {
    if (rafId.current == null) rafId.current = requestAnimationFrame(tick);
  }, [tick]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    el.dataset.tilt = 'true';

    const handleMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const px = x / rect.width;
      const py = y / rect.height;
      // Center origin: -1..1
      const cx = px * 2 - 1;
      const cy = py * 2 - 1;
      targetRY.current = cx * max;
      targetRX.current = -cy * max;
      targetMX.current = px * 100;
      targetMY.current = py * 100;
      start();
    };

    const handleEnter = () => {
      active.current = true;
      el.style.setProperty('--tilt-active', '1');
      start();
    };

    const handleLeave = () => {
      active.current = false;
      targetRX.current = 0;
      targetRY.current = 0;
      targetMX.current = 50;
      targetMY.current = 50;
      el.style.setProperty('--tilt-active', '0');
      start();
    };

    el.addEventListener('pointerenter', handleEnter);
    el.addEventListener('pointermove', handleMove);
    el.addEventListener('pointerleave', handleLeave);

    return () => {
      el.removeEventListener('pointerenter', handleEnter);
      el.removeEventListener('pointermove', handleMove);
      el.removeEventListener('pointerleave', handleLeave);
      if (rafId.current != null) cancelAnimationFrame(rafId.current);
      rafId.current = null;
      delete el.dataset.tilt;
    };
  }, [enabled, max, start]);

  return ref;
}
