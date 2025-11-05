import { useCallback, useRef, useEffect } from 'react';

interface UseNotificationSoundOptions {
  /**
   * Whether sound is enabled (default: true)
   */
  enabled?: boolean;
  /**
   * Volume level between 0 and 1 (default: 0.3)
   */
  volume?: number;
  /**
   * Optional custom audio source URL (served from public/)
   * Defaults to '/mixkit-software-interface-start-2574.wav'
   */
  src?: string;
}

interface UseNotificationSoundReturn {
  /**
   * Play the notification sound
   */
  playSound: () => void;
}

/**
 * Hook to play notification sounds
 * Uses audio file for notification sounds
 *
 * @example
 * ```tsx
 * const { playSound } = useNotificationSound({ enabled: true, volume: 0.3 });
 * // Call playSound() whenever a notification is received
 * ```
 */
export function useNotificationSound(
  options: UseNotificationSoundOptions = {}
): UseNotificationSoundReturn {
  const { enabled = true, volume = 0.3, src = '/mixkit-software-interface-start-2574.wav' } = options;

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element on mount
  useEffect(() => {
    if (audioRef.current) return;

    const audio = new Audio(src);
    audio.volume = volume;
    audio.preload = 'auto';
    audioRef.current = audio;

    // Unlock audio on first user interaction
    const unlockAudio = () => {
      audio.play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
        })
        .catch(() => {
          // Expected - browser may still block
        });
    };

    // Try to unlock on various user interactions
    document.addEventListener('click', unlockAudio, { once: true });
    document.addEventListener('keydown', unlockAudio, { once: true });
    document.addEventListener('touchstart', unlockAudio, { once: true });

    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [volume, src]);

  const playBeepFallback = useCallback(() => {
    try {
      const AudioContextCtor = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextCtor) return;
      const ctx = new AudioContextCtor();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = 800;
      g.gain.value = volume;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      setTimeout(() => {
        o.stop();
        ctx.close();
      }, 200);
    } catch {}
  }, [volume]);

  const playSound = useCallback(() => {
    if (!enabled) return;

    try {
      const audio = audioRef.current;
      if (!audio) {
        // Create audio on demand if not already created
        const newAudio = new Audio(src);
        newAudio.volume = volume;
        audioRef.current = newAudio;
        
        // Try to play, but don't log autoplay errors
        newAudio.play().catch(() => {
          // Silently fail for autoplay restrictions, try fallback beep
          playBeepFallback();
        });
        return;
      }

      // Reset to beginning and play
      audio.currentTime = 0;
      audio.play().catch(() => {
        // Silently fail for autoplay restrictions - user hasn't interacted yet, try fallback
        playBeepFallback();
      });
    } catch (error) {
      // Silently handle errors
    }
  }, [enabled, volume, src, playBeepFallback]);

  return { playSound };
}

