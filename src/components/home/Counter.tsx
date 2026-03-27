"use client";
import { useEffect, useRef, useState } from "react";

interface CounterProps {
  target: number;
  suffix?: string;
}

export function Counter({ target, suffix = "" }: CounterProps) {
  const [val, setVal] = useState(target);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        let start = 0;
        setVal(0);
        const step = target / 40;
        const t = setInterval(() => {
          start += step;
          if (start >= target) { setVal(target); clearInterval(t); }
          else setVal(Math.floor(start));
        }, 30);
      }
    }, { rootMargin: "0px 0px -50px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);

  return <span ref={ref}>{val}{suffix}</span>;
}
