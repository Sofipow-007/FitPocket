import { useEffect, useRef } from "react";

/**
 * useScrollReveal
 * Agrega la clase "revealed" al elemento cuando entra en el viewport.
 * Uso: const ref = useScrollReveal(); → <div ref={ref} className="reveal">
 *
 * En CSS definís:
 *   .reveal { opacity: 0; transform: translateY(24px); transition: ... }
 *   .reveal.revealed { opacity: 1; transform: translateY(0); }
 */
export default function useScrollReveal(options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("revealed");
          observer.unobserve(el); // solo una vez
        }
      },
      {
        threshold: options.threshold ?? 0.15,
        rootMargin: options.rootMargin ?? "0px 0px -40px 0px",
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}
