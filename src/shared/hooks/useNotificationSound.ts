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
  const { enabled = true, volume = 0.3 } = options;

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element on mount
  useEffect(() => {
    if (audioRef.current) return;

    const audio = new Audio('/mixkit-software-interface-start-2574.wav');
    audio.volume = volume;
    audioRef.current = audio;

    return () => {
      // Cleanup on unmount
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [volume]);

  const playSound = useCallback(() => {
      if (!enabled) return;

      try {
        const audio = audioRef.current;
        if (!audio) {
          // Create audio on demand if not already created
          const newAudio = new Audio('/mixkit-software-interface-start-2574.wav');
          newAudio.volume = volume;
          audioRef.current = newAudio;
          newAudio.play().catch(error => {
            console.warn('Failed to play notification sound:', error);
          });
          return;
        }

        // Reset to beginning and play
        audio.currentTime = 0;
        audio.play().catch(error => {
          console.warn('Failed to play notification sound:', error);
        });
      } catch (error) {
        console.warn('Failed to play notification sound:', error);
      }
    },
    [enabled, volume]
  );

  return { playSound };
}

