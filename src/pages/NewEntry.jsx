import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useEntries } from '../hooks/useEntries';
import MarkdownEditor from '../components/MarkdownEditor';

const TEMPLATES = {
  daily: `# Daily Entry\n\n## Morning Intention\nWhat is the one thing this day is for?\n\n- \n\n## Reading\nWhat did I read today? What stayed with me?\n\n- **Book / Article:**\n- **Pages:**\n- **Thought:**\n\n## Work / Craft\nWhat did I actually work on?\n\n- \n\n## Personal / Family\nMoments that mattered.\n\n- `,
  weekly: `# Weekly Plan\n**Theme:** *(A single word or phrase)*\n\n## Focus of the Week\nIf nothing else happens, this must happen:\n\n- \n\n## Reading Goals\nBe realistic. Slow is still forward.\n\n- **Book:**\n- **Target:**\n\n## Writing / Journaling Goals\nWhat do I want to say this week?\n\n- \n\n## Life & Relationships\nWho needs my presence?\n\n- \n\n## Tasks (Only What Matters)\n- \n- \n- \n\n## Notes & Adjustments\nWhat needs to change midweek?\n\n\n## Reflection\n- What went well?\n- What felt heavy?\n- What deserves gratitude?\n\n---\n\n> *One sentence to carry into tomorrow.*`,
  reflection: `# Reflection\n\n## What I Learned\nAbout myself, others, or the world.\n\n- \n\n## What I Read That Changed Me\nA sentence, an idea, a shift.\n\n- \n\n## Patterns I Notice\nGood or bad — name them.\n\n- \n\n## What I Need Less Of\nBe honest.\n\n- \n\n## What I Need More Of\nAlso be honest.\n\n- \n\n## One Decision Going Forward\nSmall. Concrete. Real.`,
  book: `# Book Notes\n**Title:** \n**Author:** \n\n## Why I'm Reading This\nWhat called me to it?\n\n- \n\n## Key Ideas\n- \n- \n- \n\n## Quotes Worth Keeping\n> \n\n## My Response\nAgreement, resistance, questions.\n\n- \n\n## Where This Fits in My Life\nWhat does this book ask of me?\n\n`,
  personal: `# Personal Index\n\n## Current Reading\n- \n\n## Current Focus\n- \n\n## Open Questions\n- \n\n## Ideas to Revisit\n- \n`,
};

export default function NewEntry() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getEntryById, addEntry, updateEntry } = useEntries();

  const editId = searchParams.get('id');
  const prefillDate = searchParams.get('date');
  const prefillTemplate = searchParams.get('template');

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(prefillDate || '');
  const [content, setContent] = useState('');
  const [template, setTemplate] = useState('');
  const [loadingEntry, setLoadingEntry] = useState(!!editId);

  useEffect(() => {
    if (editId) {
      (async () => {
        const entry = await getEntryById(editId);
        if (!entry) {
          alert('Entry not found.');
          navigate('/journal');
          return;
        }
        setTitle(entry.title);
        setDate(entry.date);
        setContent(entry.content);
        setLoadingEntry(false);
      })();
    }
  }, [editId]);

  useEffect(() => {
    if (!editId && prefillTemplate && TEMPLATES[prefillTemplate]) {
      setTemplate(prefillTemplate);
      setContent(TEMPLATES[prefillTemplate]);
    }
  }, [prefillTemplate]);

  const handleTemplateChange = (e) => {
    const selected = e.target.value;
    setTemplate(selected);
    if (TEMPLATES[selected]) {
      setContent(TEMPLATES[selected]);
    } else {
      setContent('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !date || !content.trim()) {
      alert('Please fill in all fields.');
      return;
    }

    if (editId) {
      const success = await updateEntry(editId, {
        title: title.trim(),
        date,
        content: content.trim(),
      });
      if (success) navigate('/journal');
    } else {
      const success = await addEntry({
        title: title.trim(),
        date,
        content: content.trim(),
      });
      if (success) navigate('/journal');
    }
  };

  if (loadingEntry) {
    return <p className="muted">Loading entry...</p>;
  }

  return (
    <>
      <div className="page-header">
        <div>
          <p className="eyebrow">{editId ? 'Update' : 'Create'}</p>
          <h2>{editId ? 'Edit Entry' : 'Add a New Entry'}</h2>
          <p className="muted">
            {editId ? 'Update your entry below.' : 'Pick a template or start from scratch.'}
          </p>
        </div>
        <Link className="btn ghost" to="/journal">Back to journal</Link>
      </div>
      <section className="form-card">
        <form onSubmit={handleSubmit}>
          {!editId && (
            <>
              <label htmlFor="template">Choose a template</label>
              <select
                id="template"
                name="template"
                value={template}
                onChange={handleTemplateChange}
              >
                <option value="">-- Select Template --</option>
                <option value="daily">Daily Entry</option>
                <option value="weekly">Weekly Plan</option>
                <option value="reflection">Reflection</option>
                <option value="book">Book Notes</option>
                <option value="personal">Personal Index</option>
              </select>
            </>
          )}

          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            name="title"
            required
            aria-required="true"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <label htmlFor="date">Date</label>
          <input
            type="date"
            id="date"
            name="date"
            required
            aria-required="true"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <label htmlFor="content">Content</label>
          <MarkdownEditor value={content} onChange={setContent} />

          <button className="btn primary" type="submit">
            {editId ? 'Update Entry' : 'Save Entry'}
          </button>
        </form>
      </section>
    </>
  );
}
