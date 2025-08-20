export function sortTasks(tasks, mode) {
  const arr = [...tasks];
  switch (mode) {
    case "date": {
      // קודם משימות עם dueDate, אחר כך ללא; בתוך כל קבוצה לפי dueDate ↑
      return arr.sort((a, b) => {
        const ad = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bd = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        if (ad !== bd) return ad - bd;
        // טיי־ברייקר – לפי updatedAt ↓ כדי להרגיש “חי”
        return (b.updatedAt ?? 0) - (a.updatedAt ?? 0);
      });
    }
    case "starred": {
      // ראשית מסומנות בכוכב, מסודרות לפי updatedAt ↓ (הכי לאחרונה למעלה)
      return arr.sort((a, b) => {
        if (!!b.starred - !!a.starred) return (!!b.starred) - (!!a.starred);
        return (b.updatedAt ?? 0) - (a.updatedAt ?? 0);
      });
    }
    case "title": {
      return arr.sort((a, b) => (a.title || "").localeCompare(b.title || "", "he", { sensitivity: "base" }));
    }
    case "manual":
    default:
      return arr; // לא משנים את הסדר (drag & drop/סדר יצירה)
  }
}
