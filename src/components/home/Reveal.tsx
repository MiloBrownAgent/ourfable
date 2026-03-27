"use client";
import { useIntersectionObserver } from "../../hooks/useIntersectionObserver";

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}

export function Reveal({ children, delay = 0, style = {} }: RevealProps) {
  const [ref, done] = useIntersectionObserver({ threshold: 0.01, rootMargin: "120px 0px 120px 0px", once: true });
  return (
    <div
      ref={ref}
      style={{
        opacity: done ? 1 : 0,
        transform: done ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
