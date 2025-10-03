"use client";
import { useEffect, useRef } from "react";

type UsePollOptions = {
  immediate?: boolean; // run once immediately (default: true)
  onError?: (err: unknown) => void; // optional error handler
};

export function usePoll(
  fn: () => void | Promise<void>,
  ms: number,
  deps: React.DependencyList = [],
  options: UsePollOptions = {},
) {
  const timer = useRef<number | null>(null);
  const { immediate = true, onError } = options;

  useEffect(() => {
    let cancelled = false;

    const schedule = () => {
      if (cancelled) return;
      timer.current = window.setTimeout(tick, ms);
    };

    async function tick() {
      try {
        await fn();
      } catch (e) {
        onError?.(e);
      } finally {
        schedule();
      }
    }

    // run once immediately if requested
    if (immediate) {
      void tick();
    } else {
      schedule();
    }

    // also refresh when tab becomes active
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        Promise.resolve(fn()).catch(onError); // ✅ normalize to Promise
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      if (timer.current) window.clearTimeout(timer.current);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
