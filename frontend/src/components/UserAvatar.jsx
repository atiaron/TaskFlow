import React from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * UserAvatar
 * - Shows current user's initials (or placeholder)
 * - Loading shimmer while resolving auth state
 * - Accessible button (will later open profile menu)
 *
 * Props:
 *  onClick?: () => void
 */
const UserAvatar = React.forwardRef(function UserAvatar({ onClick, size = 40, className = '' }, ref) {
  const { user, status } = useAuth();
  const loading = status === 'loading';
  const label = user?.displayName || user?.name || 'אורח';
  const initials = label ? label.trim().charAt(0).toUpperCase() : '?';

  return (
    <button
      type="button"
      aria-label={`משתמש: ${label}`}
      className={`gt-userAvatar ${loading ? 'is-loading' : 'is-ready'} ${className}`.trim()}
      onClick={onClick}
      data-state={loading ? 'loading' : 'ready'}
      style={{ '--avatar-size': `${size}px` }}
      ref={ref}
    >
      {loading ? <span className="gt-avatar__skeleton" aria-hidden /> : initials}
    </button>
  );
});

export default UserAvatar;
