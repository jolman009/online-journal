/**
 * Download data as a JSON file
 * @param {Object} data - Data to export
 * @param {string} filename - Name of the file (without extension)
 */
export function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export journal entries
 * @param {Array} entries - Array of entry objects
 */
export function exportEntries(entries) {
  const exportData = {
    exportedAt: new Date().toISOString(),
    type: 'journal_entries',
    count: entries.length,
    entries: entries.map(e => ({
      id: e.id,
      title: e.title,
      date: e.date,
      content: e.content,
      tags: e.tags || [],
      pinned: e.pinned || false,
      created_at: e.created_at,
    })),
  };
  downloadJSON(exportData, `journal-entries-${new Date().toISOString().split('T')[0]}`);
}

/**
 * Export todos
 * @param {Array} todos - Array of todo objects
 */
export function exportTodos(todos) {
  const exportData = {
    exportedAt: new Date().toISOString(),
    type: 'todos',
    count: todos.length,
    todos: todos.map(t => ({
      id: t.id,
      text: t.text,
      date: t.date,
      tags: t.tags || [],
      completed: t.completed,
      created_at: t.created_at,
    })),
  };
  downloadJSON(exportData, `todos-${new Date().toISOString().split('T')[0]}`);
}
