import { useState, useEffect, useCallback } from "react";

interface UseCountdownOptions {
  initialSeconds: number;
  onComplete?: () => void;
  autoStart?: boolean;
}

interface UseCountdownReturn {
  seconds: number;
  isActive: boolean;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  formattedTime: string;
}

/**
 * A custom hook for managing countdown timers
 * @param initialSeconds - The initial countdown duration in seconds
 * @param onComplete - Callback function when countdown reaches zero
 * @param autoStart - Whether to start the countdown automatically
 * @returns Object containing timer state and control functions
 */
export const useCountdown = ({
  initialSeconds,
  onComplete,
  autoStart = false,
}: UseCountdownOptions): UseCountdownReturn => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(autoStart);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((prevSeconds) => {
          if (prevSeconds <= 1) {
            setIsActive(false);
            onComplete?.();
            return 0;
          }
          return prevSeconds - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, onComplete]);

  const start = useCallback(() => {
    setIsActive(true);
  }, []);

  const pause = useCallback(() => {
    setIsActive(false);
  }, []);

  const resume = useCallback(() => {
    if (seconds > 0) {
      setIsActive(true);
    }
  }, [seconds]);

  const reset = useCallback(() => {
    setSeconds(initialSeconds);
    setIsActive(false);
  }, [initialSeconds]);

  const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return {
    seconds,
    isActive,
    start,
    pause,
    resume,
    reset,
    formattedTime: formatTime(seconds),
  };
};
