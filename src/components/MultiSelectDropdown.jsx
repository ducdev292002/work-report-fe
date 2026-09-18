import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, X } from 'lucide-react';

// A checkbox-list dropdown for picking any number of options (projects),
// rendered as chips + "N đã chọn" summary — plain <select> doesn't support a
// friendly multi-pick UI without holding Ctrl. The panel is portaled to
// <body> and positioned via the trigger's rect, so it never gets clipped by
// an ancestor with overflow-hidden (e.g. a rounded table card).
export default function MultiSelectDropdown({ options, selected, onChange, placeholder = 'Chọn...', className = '' }) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        panelRef.current && !panelRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    function reposition() {
      if (triggerRef.current) setRect(triggerRef.current.getBoundingClientRect());
    }
    reposition();
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [open]);

  const selectedOptions = options.filter((o) => selected.includes(o.value));

  function toggle(value) {
    if (selected.includes(value)) onChange(selected.filter((v) => v !== value));
    else onChange([...selected, value]);
  }

  return (
    <div className={className}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="input-sm w-full flex items-center justify-between gap-1 text-left"
      >
        <span className="flex flex-wrap gap-1 min-w-0">
          {selectedOptions.length === 0 ? (
            <span className="text-gray-400">{placeholder}</span>
          ) : selectedOptions.length <= 2 ? (
            selectedOptions.map((o) => (
              <span key={o.value} className="badge-brand">{o.label}</span>
            ))
          ) : (
            <span className="badge-brand">{selectedOptions.length} dự án</span>
          )}
        </span>
        <ChevronDown size={14} className="shrink-0 text-gray-400" />
      </button>

      {open && rect && createPortal(
        <div
          ref={panelRef}
          style={{ position: 'fixed', top: rect.bottom + 4, left: rect.left, width: Math.max(rect.width, 200) }}
          className="z-50 max-h-60 overflow-y-auto bg-white rounded-lg shadow-popover border border-gray-100 py-1 animate-fade-in"
        >
          {options.length === 0 && (
            <div className="px-3 py-2 text-xs text-gray-400">Không có dự án nào</div>
          )}
          {options.map((o) => {
            const checked = selected.includes(o.value);
            return (
              <button
                type="button"
                key={o.value}
                onClick={() => toggle(o.value)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-gray-50"
              >
                <span
                  className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                    checked ? 'bg-brand-600 border-brand-600 text-white' : 'border-gray-300'
                  }`}
                >
                  {checked && <Check size={11} />}
                </span>
                <span className="truncate">{o.label}</span>
              </button>
            );
          })}
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="w-full flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 border-t border-gray-100 mt-1"
            >
              <X size={11} /> Bỏ chọn tất cả
            </button>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
