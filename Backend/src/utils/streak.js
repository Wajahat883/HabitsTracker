// Utility functions for streak and completion calculations
export function calculateDailyStreak(logs, missToleranceDays = 1) {
  // logs: array sorted desc by date (YYYY-MM-DD) with status='completed' or others
  // missToleranceDays=1 means allow ONE missed day between completions; 2 missed (gap >=3) resets.
  let streak = 0;
  let prev = null;
  for (const l of logs) {
    if (l.status !== 'completed') break; // only consecutive completed entries count
    if (!prev) {
      streak = 1; prev = l.date; continue;
    }
    const prevDate = new Date(prev + 'T00:00:00Z');
    const curDate = new Date(l.date + 'T00:00:00Z');
    const diff = (prevDate - curDate) / 86400000; // days gap between consecutive completed logs
    if (diff <= 1) { // consecutive day
      streak++; prev = l.date; continue;
    }
    if (diff === 2 && missToleranceDays >= 1) { // one missed day allowed
      streak++; prev = l.date; continue;
    }
    // gap >=3 days -> at least 2 missed days, break streak
    break;
  }
  return streak;
}

export function fillDateRange(from, to) {
  const out = [];
  const start = new Date(from + 'T00:00:00Z');
  const end = new Date(to + 'T00:00:00Z');
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    out.push(d.toISOString().slice(0,10));
  }
  return out;
}
