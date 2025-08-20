import React from 'react';
import { useFocusTrap } from '../a11y/useFocusTrap';
import { useAuth } from '../contexts/AuthContext';

function useClickOutside(ref, handler){
  React.useEffect(() => {
    function onDown(e){
      if(!ref.current) return;
      if(!ref.current.contains(e.target)) handler(e);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, [ref, handler]);
}

export default function ProfileMenu({ open, onClose, anchorRef, onOpenSettings }) {
  const ref = React.useRef(null);
  useClickOutside(ref, () => onClose?.());
  const { logout, user } = useAuth();

  // Positioning (simple: below anchor, rtl aware) - could be improved with ResizeObserver later.
  const [pos, setPos] = React.useState({ top: 0, left: 0, minWidth: 0 });
  React.useLayoutEffect(() => {
    if (open && anchorRef?.current) {
      const r = anchorRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 8 + window.scrollY, left: r.left + window.scrollX, minWidth: r.width + 40 });
    }
  }, [open, anchorRef]);

  // Always call hooks in same order; don't guard the hook itself.
  useFocusTrap(ref, { active: open, returnFocusTo: anchorRef?.current || null });
  if (!open) return null;

  async function handleLogout(){
    try { await logout(); } catch {}
    onClose?.();
  }

  return (
    <div
      className="gt-profileMenu"
      role="menu"
      aria-label="תפריט משתמש"
      ref={ref}
      style={{ top: pos.top, left: pos.left, minWidth: pos.minWidth, position:'absolute' }}
      dir="rtl"
    >
      <div className="gt-profileMenu__section" role="none">
        <div className="gt-profileMenu__meta" role="none">{user?.displayName || 'אורח'}</div>
        <button role="menuitem" type="button" className="gt-profileMenu__item" onClick={() => {/* open profile edit future */}}>
          פרופיל
        </button>
  <button role="menuitem" type="button" className="gt-profileMenu__item" onClick={() => { onOpenSettings?.(); onClose?.(); }}>
          הגדרות
        </button>
      </div>
      <div className="gt-profileMenu__section" role="none">
        <button role="menuitem" type="button" className="gt-profileMenu__item is-danger" onClick={handleLogout}>
          התנתקות
        </button>
      </div>
    </div>
  );
}
