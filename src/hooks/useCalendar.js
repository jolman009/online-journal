export function buildEntryDateSet(entries) {
  const set = new Set();
  entries.forEach(e => {
    if (e.date) set.add(e.date);
  });
  return set;
}

export function buildEntryDateMap(entries) {
  const map = new Map();
  entries.forEach(e => {
    if (e.date) {
      map.set(e.date, (map.get(e.date) || 0) + 1);
    }
  });
  return map;
}

export function buildTodoDateSet(todos) {
  const set = new Set();
  todos.forEach(t => {
    if (t.date && !t.completed) set.add(t.date);
  });
  return set;
}

export function formatDateStr(year, month, day) {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}
