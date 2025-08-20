import React from 'react';
import HeaderTabs from '../features/task-list/components/HeaderTabs';
import UserAvatar from './UserAvatar';
import ProfileMenu from './ProfileMenu';

/**
 * AppHeader
 * Presentational header with slots: logo, tabs(nav), identity.
 * Props:
 *  - currentViewId
 *  - activeCount (number of active tasks for 'all' badge)
 *  (notifications removed)
 */
export default function AppHeader({ currentViewId, activeCount, onOpenSettings }) {
  const avatarRef = React.useRef(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  function toggleMenu(){ setMenuOpen(o => !o); }
  function closeMenu(){ setMenuOpen(false); }

  // Close on ESC
  React.useEffect(() => {
    if (!menuOpen) return;
    function onKey(e){ if (e.key === 'Escape') { e.stopPropagation(); closeMenu(); } }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <header className="gt-appHeader" role="banner">
      <div className="gt-appHeader__logo" aria-label="TaskFlow" role="img">TF</div>
      <nav className="gt-appHeader__tabs" aria-label="רשימות" role="navigation">
        <HeaderTabs activeViewId={currentViewId} count={activeCount} />
      </nav>
      <div className="gt-appHeader__identity">
        <UserAvatar onClick={toggleMenu} ref={avatarRef} />
      </div>
  <ProfileMenu open={menuOpen} onClose={closeMenu} anchorRef={avatarRef} onOpenSettings={onOpenSettings} />
    </header>
  );
}
