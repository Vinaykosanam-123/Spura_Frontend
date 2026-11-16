'use client';

import { useCallback, useEffect, useState } from 'react';

export function useStepPlayer(total: number) {
  const last = Math.max(0, total - 1);
  const [rawIndex, setRawIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const index = Math.min(rawIndex, last);

  useEffect(() => {
    if (!playing || total <= 1) return;
    if (index >= last) return;
    const delay = Math.max(90, 620 / speed);
    const timer = window.setTimeout(() => {
      const next = Math.min(index + 1, last);
      setRawIndex(next);
      if (next >= last) setPlaying(false);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [playing, index, last, speed, total]);

  const toggle = useCallback(() => {
    if (total <= 1) return;
    if (playing) {
      setPlaying(false);
      return;
    }
    if (index >= last) setRawIndex(0);
    setPlaying(true);
  }, [index, last, playing, total]);

  const next = useCallback(() => {
    setPlaying(false);
    setRawIndex((i) => Math.min(i + 1, last));
  }, [last]);

  const prev = useCallback(() => {
    setPlaying(false);
    setRawIndex((i) => Math.max(i - 1, 0));
  }, []);

  const reset = useCallback(() => {
    setPlaying(false);
    setRawIndex(0);
  }, []);

  const restartAndPlay = useCallback(() => {
    setRawIndex(0);
    setPlaying(true);
  }, []);

  return {
    index,
    total,
    playing,
    speed,
    setSpeed,
    toggle,
    next,
    prev,
    reset,
    restartAndPlay,
    atStart: index === 0,
    atEnd: index >= last,
  };
}
