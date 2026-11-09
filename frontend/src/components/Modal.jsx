import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, description, children, size = 'md' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => { if (event.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.(); }}>
      <section className={`modal modal-${size}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-head">
          <div><h2 id="modal-title">{title}</h2>{description && <p>{description}</p>}</div>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={19}/></button>
        </div>
        <div className="modal-body">{children}</div>
      </section>
    </div>
  );
}
