import { useEffect, useRef } from "react";

/**
 * Adds `.is-visible` to the element when it enters the viewport.
 * Respects prefers-reduced-motion (reveals immediately).
 * Returns a ref to attach to the target element.
 */
export function useReveal({ threshold = 0.15 } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is-visible");
      return undefined;
    }
    if (!("IntersectionObserver" in window)) {
      el.classList.add("is-visible");
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin: "0px 0px -8% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return ref;
}

export default useReveal;
