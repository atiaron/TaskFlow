/**
 * Utility functions for date handling with Hebrew/RTL support
 */

// Hebrew month names
export const hebrewMonths = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
];

// Hebrew day names (for headers, short version)
export const hebrewDayNames = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

/**
 * Gets the name of the month in Hebrew
 * @param {Date} date - The date to get the month name for
 * @returns {string} The Hebrew month name
 */
export const getHebrewMonthName = (date) => {
  const monthIndex = date.getMonth();
  return hebrewMonths[monthIndex];
};

/**
 * Formats the month and year for display in the calendar header
 * @param {Date} date - The date to format
 * @returns {string} Formatted month and year in Hebrew
 */
export const formatMonthYear = (date) => {
  const monthName = getHebrewMonthName(date);
  const year = date.getFullYear();
  return `${monthName} ${year}`;
};

/**
 * Gets the first day of the month
 * @param {Date} date - Any date in the month
 * @returns {Date} The first day of the month
 */
export const getFirstDayOfMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

/**
 * Gets the last day of the month
 * @param {Date} date - Any date in the month
 * @returns {Date} The last day of the month
 */
export const getLastDayOfMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

/**
 * Gets the number of days in the month
 * @param {Date} date - Any date in the month
 * @returns {number} The number of days in the month
 */
export const getDaysInMonth = (date) => {
  return getLastDayOfMonth(date).getDate();
};

/**
 * Checks if two dates are the same day
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {boolean} True if same day, false otherwise
 */
export const isSameDay = (date1, date2) => {
  if (!date1 || !date2) return false;
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

/**
 * Checks if a date is today
 * @param {Date} date - The date to check
 * @returns {boolean} True if today, false otherwise
 */
export const isToday = (date) => {
  return isSameDay(date, new Date());
};

/**
 * Generates an array of dates for the calendar view
 * @param {Date} date - Current displayed month
 * @returns {Array} Array of date objects with additional info
 */
export const generateCalendarDays = (date) => {
  const firstDay = getFirstDayOfMonth(date);
  const lastDay = getLastDayOfMonth(date);
  const daysInMonth = getDaysInMonth(date);
  
  // Get day of week for the first day (0 = Sunday, 6 = Saturday)
  // For RTL Hebrew calendar, we'll adjust this where Sunday is index 6
  let dayOfWeek = firstDay.getDay();
  
  // Convert from Sunday = 0 to Sunday = 6 for RTL Hebrew calendar
  // Sunday (0) becomes 6, Monday (1) becomes 0, Tuesday (2) becomes 1, etc.
  dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  const days = [];
  
  // Add days from previous month
  const previousMonth = new Date(date);
  previousMonth.setMonth(previousMonth.getMonth() - 1);
  const prevMonthDays = getDaysInMonth(previousMonth);
  
  for (let i = dayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const prevMonthDate = new Date(previousMonth.getFullYear(), previousMonth.getMonth(), day);
    days.push({
      date: prevMonthDate,
      day,
      inMonth: false,
    });
  }
  
  // Add days from current month
  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(date.getFullYear(), date.getMonth(), day);
    days.push({
      date: currentDate,
      day,
      inMonth: true,
    });
  }
  
  // Add days from next month
  const nextMonth = new Date(date);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const remainingCells = 42 - days.length; // 6 rows * 7 days = 42 cells
  
  for (let day = 1; day <= remainingCells; day++) {
    const nextMonthDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), day);
    days.push({
      date: nextMonthDate,
      day,
      inMonth: false,
    });
  }
  
  return days;
};

/**
 * Formats a time string in 12-hour format with AM/PM
 * @param {number} hours - Hours (0-23)
 * @param {number} minutes - Minutes (0-59)
 * @returns {string} Formatted time string
 */
export const formatTime = (hours, minutes) => {
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${period}`;
};

/**
 * Gets a user-friendly relative date string
 * @param {Date} date - The date to format
 * @returns {string} A user-friendly string like "Today", "Tomorrow", etc.
 */
export const getRelativeDateString = (date) => {
  if (!date) return '';
  
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (isSameDay(date, today)) {
    return 'היום';
  } else if (isSameDay(date, tomorrow)) {
    return 'מחר';
  } else {
    // Format with day, month
    const day = date.getDate();
    const month = getHebrewMonthName(date);
    return `${day} ${month}`;
  }
};

/**
 * Formats a complete date and time for display
 * @param {Date} date - The date to format
 * @returns {string} Formatted date and time string
 */
export const formatDateTimeForDisplay = (date) => {
  if (!date) return '';
  
  const relativeDate = getRelativeDateString(date);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const timeString = formatTime(hours, minutes);
  
  return `${relativeDate}, ${timeString}`;
};

/**
 * Calculates the position of an hour number on a clock circle
 * @param {number} hour - The hour (0-23)
 * @param {boolean} is24Hour - Whether to use 24-hour clock (true) or 12-hour clock (false)
 * @param {number} radius - The radius of the clock circle
 * @returns {Object} The x and y coordinates for positioning the hour
 */
export const calculateHourPosition = (hour, is24Hour = true, radius = 120) => {
  // For 24-hour clock, we need to adjust how hours are positioned
  // Hours 0-11 go on the outer circle, hours 12-23 go on the inner circle
  let adjustedHour;
  let adjustedRadius;
  
  if (is24Hour) {
    // For 24-hour clock, we have two circles
    // Inner circle for 13-24 (or 1-12 PM)
    // Outer circle for 1-12 (or 1-12 AM)
    if (hour > 12) {
      // PM hours go on inner circle
      adjustedHour = hour - 12;
      adjustedRadius = radius * 0.65; // Inner circle is smaller
    } else if (hour === 0) {
      // Midnight (0) displayed as 24 on the inner circle
      adjustedHour = 12;
      adjustedRadius = radius * 0.65;
    } else if (hour === 12) {
      // Noon (12) on the outer circle
      adjustedHour = 12;
      adjustedRadius = radius;
    } else {
      // AM hours go on outer circle
      adjustedHour = hour;
      adjustedRadius = radius;
    }
  } else {
    // For 12-hour clock, all hours go on the same circle
    adjustedHour = hour % 12 || 12; // Convert 0 to 12
    adjustedRadius = radius;
  }
  
  // Calculate position based on the hour
  // In a clock, 12 is at the top (270 degrees in math), and we go clockwise
  // Each hour represents 30 degrees (360 / 12)
  const angleInRadians = ((adjustedHour * 30) - 90) * (Math.PI / 180);
  
  // Calculate the coordinates
  const x = adjustedRadius * Math.cos(angleInRadians);
  const y = adjustedRadius * Math.sin(angleInRadians);
  
  return { x, y };
};

/**
 * Calculates the position of a minute on a clock circle
 * @param {number} minute - The minute (0-59)
 * @param {number} radius - The radius of the clock circle
 * @returns {Object} The x and y coordinates for positioning the minute
 */
export const calculateMinutePosition = (minute, radius = 120) => {
  // Each minute represents 6 degrees (360 / 60)
  const angleInRadians = ((minute * 6) - 90) * (Math.PI / 180);
  
  // Calculate the coordinates
  const x = radius * Math.cos(angleInRadians);
  const y = radius * Math.sin(angleInRadians);
  
  return { x, y };
};

/**
 * Calculates the angle of the clock hand
 * @param {number} value - The hour (0-23) or minute (0-59)
 * @param {boolean} isHour - Whether the value is an hour (true) or minute (false)
 * @returns {number} The angle in degrees for the clock hand
 */
export const calculateHandAngle = (value, isHour = true) => {
  if (isHour) {
    // For 24-hour clock, we need to adjust
    const adjustedHour = value % 12 || 12;
    // Each hour is 30 degrees
    return (adjustedHour * 30) - 90;
  } else {
    // Each minute is 6 degrees
    return (value * 6) - 90;
  }
};