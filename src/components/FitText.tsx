import { useLayoutEffect, useRef } from 'react';

interface Props {
  text: string;
  /** Font size in px when the text fits on one line, and the smallest size before it is cut with "…". */
  max: number;
  min: number;
  className?: string;
}

/** One line only: the font shrinks as the text gets longer so a card never grows taller. */
export function FitText({ text, max, min, className = '' }: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      let size = max;
      el.style.fontSize = `${size}px`;
      while (size > min && el.scrollWidth > el.clientWidth) {
        size -= 0.5;
        el.style.fontSize = `${size}px`;
      }
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text, max, min]);

  return (
    <span ref={ref} className={`block overflow-hidden text-ellipsis whitespace-nowrap ${className}`} style={{ fontSize: max }}>
      {text}
    </span>
  );
}
