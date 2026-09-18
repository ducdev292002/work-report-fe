import { useEffect, useRef } from 'react';

// A single-line-looking field that grows taller as the user types more than
// fits, instead of clipping text like a plain <input>. Enter submits (via
// onEnter) unless Shift is held, in which case it inserts a newline.
export default function AutoResizeTextarea({ value, onChange, onBlur, onEnter, className = '', ...props }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey && onEnter) {
          e.preventDefault();
          onEnter(e);
        }
      }}
      className={`resize-none overflow-hidden leading-snug ${className}`}
      {...props}
    />
  );
}
