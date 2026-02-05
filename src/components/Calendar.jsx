import { useState } from 'react';
import { formatDateStr } from '../hooks/useCalendar';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function Calendar({ entryDateSet, todoDateSet, onDateClick }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

  const todayStr = formatDateStr(now.getFullYear(), now.getMonth(), now.getDate());
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(y => y - 1);
    } else {
      setMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(y => y + 1);
    } else {
      setMonth(m => m + 1);
    }
  };

  const handleDateClick = (dateStr) => {
    setSelectedDate(dateStr);
    if (onDateClick) onDateClick(dateStr);
  };

  const emptyCells = Array.from({ length: firstDay }, (_, i) => (
    <div key={`empty-${i}`} className="cal-cell cal-cell--empty" />
  ));

  const todoSet = todoDateSet || new Set();

  const dayCells = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dateStr = formatDateStr(year, month, day);
    const isToday = dateStr === todayStr;
    const isSelected = dateStr === selectedDate;
    const hasEntry = entryDateSet.has(dateStr);
    const hasTodo = todoSet.has(dateStr);

    let cellClass = 'cal-cell';
    if (isToday) cellClass += ' cal-cell--today';
    if (isSelected) cellClass += ' cal-cell--selected';
    if (hasEntry || hasTodo) cellClass += ' cal-cell--has-entry';

    return (
      <button
        key={dateStr}
        className={cellClass}
        type="button"
        onClick={() => handleDateClick(dateStr)}
      >
        <span className="cal-day-num">{day}</span>
        {(hasEntry || hasTodo) && (
          <span className="cal-dots">
            {hasEntry && <span className="cal-dot cal-dot--entry" />}
            {hasTodo && <span className="cal-dot cal-dot--todo" />}
          </span>
        )}
      </button>
    );
  });

  return (
    <div>
      <div className="cal-header">
        <button className="cal-nav-btn" type="button" aria-label="Previous month" onClick={prevMonth}>
          &#8249;
        </button>
        <span className="cal-title">{MONTH_NAMES[month]} {year}</span>
        <button className="cal-nav-btn" type="button" aria-label="Next month" onClick={nextMonth}>
          &#8250;
        </button>
      </div>
      <div className="cal-dow">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="cal-grid">
        {emptyCells}
        {dayCells}
      </div>
    </div>
  );
}
