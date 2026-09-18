import { useState } from 'react';
import Modal from './Modal.jsx';

const DEFAULT_THRESHOLD = 140;

// Renders a clamped preview of long text (report content, task notes...) and
// a "Xem thêm" link that opens the full text in a modal, instead of letting
// a single very-long entry blow out a table row's height for everyone.
export default function ExpandableText({ text, title = 'Chi tiết', threshold = DEFAULT_THRESHOLD, className = '' }) {
  const [open, setOpen] = useState(false);
  if (!text) return <span className="text-gray-300">—</span>;

  const isLong = text.length > threshold;
  const preview = isLong ? `${text.slice(0, threshold).trimEnd()}…` : text;

  return (
    <>
      <span className={`whitespace-pre-wrap ${className}`}>
        {preview}
        {isLong && (
          <button onClick={() => setOpen(true)} className="link-action ml-1 whitespace-nowrap">
            Xem thêm
          </button>
        )}
      </span>
      {open && (
        <Modal title={title} onClose={() => setOpen(false)}>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{text}</p>
        </Modal>
      )}
    </>
  );
}
