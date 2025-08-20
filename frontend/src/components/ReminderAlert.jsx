export default function ReminderAlert({ open, onOpenSettings }) {
  if (!open) return null;
  return (
    <div className="gt-alert" role="status" aria-live="polite">
      <div className="gt-alert-title">התזכורות שתלויות בזמן מושבתות</div>
      <div className="gt-alert-desc">
        כדי לקבל תזכורות בזמן, צריך לתת ל-Tasks הרשאה ליצור התראות ותזכורות בהגדרות.
      </div>
      <button type="button" className="gt-alert-link" onClick={onOpenSettings}>
        להגדרות
      </button>
    </div>
  );
}
