const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Resolve paths relative to this file so the server works when moved.
const publicDir = __dirname;
const dataFile = path.join(__dirname, 'data', 'entries.json');

app.use(express.static(publicDir));
app.use(express.json());

async function ensureDataFile() {
  // Create data directory and seed empty array on first run.
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, '[]', 'utf8');
  }
}

async function readEntries() {
  await ensureDataFile();
  const raw = await fs.readFile(dataFile, 'utf8');
  return raw ? JSON.parse(raw) : [];
}

async function writeEntries(entries) {
  await fs.writeFile(dataFile, JSON.stringify(entries, null, 2), 'utf8');
}

app.get('/api/entries', async (req, res) => {
  try {
    const entries = await readEntries();
    res.json(entries);
  } catch (err) {
    console.error('Failed to read entries:', err);
    res.status(500).json({ error: 'Unable to load entries' });
  }
});

app.post('/api/entries', async (req, res) => {
  const { title, date, content } = req.body || {};
  if (!title || !date || !content) {
    return res.status(400).json({ error: 'Missing title, date, or content' });
  }

  const entry = {
    title: title.trim(),
    date,
    content: content.trim(),
    timestamp: Date.now()
  };

  try {
    const entries = await readEntries();
    entries.push(entry);
    await writeEntries(entries);
    console.log('Saved new entry:', entry);
    res.status(201).json({ message: 'Entry saved successfully', entry });
  } catch (err) {
    console.error('Failed to save entry:', err);
    res.status(500).json({ error: 'Unable to save entry' });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
