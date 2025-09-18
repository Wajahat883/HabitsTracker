import React, { useMemo } from 'react';
import { useCompletion } from '../../context/CompletionContext';

// Utility helpers
const dateKey = d => d.toISOString().slice(0,10);
const parseDate = s => new Date(s + 'T00:00:00Z');

function rangeDays(start, end) {
  const out = []; const cur = new Date(start);
  while (cur <= end) { out.push(new Date(cur)); cur.setUTCDate(cur.getUTCDate()+1); }
  return out;
}

function weeksBetween(start, end) {
  // Returns array of weeks, each week is array of 7 Date objects (Sunday start)
  const weeks = [];
  const cursor = new Date(start);
  // move cursor back to Sunday
  cursor.setUTCDate(cursor.getUTCDate() - cursor.getUTCDay());
  while (cursor <= end) {
    const week = [];
    for (let i=0;i<7;i++) { week.push(new Date(cursor)); cursor.setUTCDate(cursor.getUTCDate()+1); }
    weeks.push(week);
  }
  return weeks;
}

function monthsBetween(start, end) {
  const months = [];
  const s = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  const e = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
  while (s <= e) { months.push(new Date(s)); s.setUTCMonth(s.getUTCMonth()+1); }
  return months;
}

export default function HabitScheduleTable({ habit, logsMap }) {
  const { toggleStatus, isLocked } = useCompletion();
  const today = useMemo(() => new Date(), []);
  const start = useMemo(() => (habit.startDate ? parseDate(habit.startDate) : new Date(habit.createdAt)), [habit.startDate, habit.createdAt]);
  const end = useMemo(() => {
    const rawEnd = habit.endDate ? parseDate(habit.endDate) : today;
    return rawEnd > today ? today : rawEnd;
  }, [habit.endDate, today]);

  const dailyCells = useMemo(() => {
    if (habit.frequencyType !== 'daily') return [];
    return rangeDays(start, end).map(d => ({ date: dateKey(d) }));
  }, [habit.frequencyType, start, end]);

  const weeklyWeeks = useMemo(() => {
    if (habit.frequencyType !== 'weekly') return [];
    return weeksBetween(start, end);
  }, [habit.frequencyType, start, end]);

  const monthlyMonths = useMemo(() => {
    if (habit.frequencyType !== 'monthly') return [];
    return monthsBetween(start, end);
  }, [habit.frequencyType, start, end]);

  const getStatus = (dStr) => {
    const entries = logsMap[habit._id];
    if (!entries) return null;
    const entry = entries.find(l => l.date === dStr);
    return entry ? entry.status : null;
  };

  const getIsLocked = (dStr) => {
    return isLocked(habit._id, dStr);
  };

  const handleToggle = (dateStr) => {
    toggleStatus(habit._id, dateStr);
  };

  if (!['daily','weekly','monthly'].includes(habit.frequencyType)) return null;

  return (
    <div className="mt-4 overflow-x-auto">
      {habit.frequencyType === 'daily' && (
        <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(36px,1fr))' }}>
          {dailyCells.map(c => {
            const status = getStatus(c.date);
            const locked = getIsLocked(c.date);
            const isToday = c.date === dateKey(today);

            return (
              <button key={c.date} onClick={() => handleToggle(c.date)} disabled={c.date > dateKey(today) || locked}
                className={`h-9 text-xs rounded flex items-center justify-center border transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 relative
                ${status === 'completed' ? 'bg-green-500 border-green-400 text-white' : status === 'skipped' ? 'bg-slate-600 border-slate-500 text-slate-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}
                ${isToday ? 'ring-1 ring-blue-400' : ''}
                ${locked ? 'opacity-75 cursor-not-allowed' : ''}`}
                title={locked ? `${c.date} (Locked)` : c.date}>
                {c.date.slice(5)}
                {locked && <span className="absolute top-0 right-0 text-[8px]">🔒</span>}
              </button>
            );
          })}
        </div>
      )}
      {habit.frequencyType === 'weekly' && (
        <table className="min-w-full text-xs border border-slate-700 rounded">
          <thead>
            <tr className="bg-slate-700/40">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <th key={d} className="px-2 py-1 font-medium text-slate-300">{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {weeklyWeeks.map((week,i) => (
              <tr key={i} className="even:bg-slate-800/40">
                {week.map(day => {
                  const dStr = dateKey(day);
                  const inRange = day >= start && day <= end;
                  const scheduled = habit.daysOfWeek?.includes(day.getUTCDay());
                  const status = scheduled && inRange ? getStatus(dStr) : null;
                  return (
                    <td key={dStr} className={`p-0.5 text-center ${!inRange ? 'opacity-30' : ''}`}>
                      {scheduled && inRange ? (
                        <button onClick={()=>handleToggle(dStr)} disabled={dStr > dateKey(today) || getIsLocked(dStr)}
                          className={`w-8 h-8 rounded text-[10px] border flex items-center justify-center mx-auto transition-colors duration-150 relative
                          ${status === 'completed' ? 'bg-green-500 border-green-400 text-white' : status === 'skipped' ? 'bg-slate-600 border-slate-500 text-slate-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}
                          ${getIsLocked(dStr) ? 'opacity-75 cursor-not-allowed' : ''}`}
                          title={getIsLocked(dStr) ? `${dStr} (Locked)` : dStr}>
                          {dStr.slice(5)}
                          {getIsLocked(dStr) && <span className="absolute top-0 right-0 text-[6px]">🔒</span>}
                        </button>
                      ) : (
                        <div className="w-8 h-8 mx-auto rounded bg-slate-900/30 border border-slate-800" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {habit.frequencyType === 'monthly' && (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          {monthlyMonths.map(m => {
            const mk = m.toISOString().slice(0,7);
            // Derive days in this month within range
            const monthStart = new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth(), 1));
            const nextMonth = new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth()+1, 1));
            const monthEnd = new Date(nextMonth - 1);
            const clampedStart = monthStart < start ? start : monthStart;
            const clampedEnd = monthEnd > end ? end : monthEnd;
            const days = rangeDays(clampedStart, clampedEnd);
            const completedDays = days.filter(d => getStatus(dateKey(d)) === 'completed').length;
            return (
              <div key={mk} className="p-3 rounded border border-slate-700 bg-slate-800/40">
                <div className="text-sm font-semibold mb-2 flex items-center justify-between">
                  <span>{mk}</span>
                  <span className="text-xs text-slate-400">{completedDays}/{days.length}</span>
                </div>
                <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(20px,1fr))' }}>
                  {days.map(d => {
                    const dStr = dateKey(d);
                    const status = getStatus(dStr);
                    return (
                      <button key={dStr} onClick={()=>handleToggle(dStr)} disabled={dStr > dateKey(today) || getIsLocked(dStr)}
                        className={`h-5 rounded border transition-colors duration-150 relative ${status === 'completed' ? 'bg-green-500 border-green-500' : status === 'skipped' ? 'bg-slate-600 border-slate-600' : 'bg-slate-900 border-slate-700 hover:bg-slate-700'}
                        ${getIsLocked(dStr) ? 'opacity-75 cursor-not-allowed' : ''}`}
                        title={getIsLocked(dStr) ? `${dStr} (Locked)` : dStr}>
                        {getIsLocked(dStr) && <span className="absolute inset-0 flex items-center justify-center text-[8px]">🔒</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
