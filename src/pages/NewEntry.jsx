import { useState, useEffect, useRef, useCallback } from 'react'; // Added useCallback
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useEntries } from '../hooks/useEntries.jsx';
import MarkdownEditor from '../components/MarkdownEditor';
import TagInput from '../components/TagInput';
import { useAuth } from '../context/AuthContext'; // Import useAuth
import { encryptData, decryptData } from '../lib/crypto'; // Import crypto utilities
import { useHapticFeedback } from '../hooks/useHapticFeedback'; // Import useHapticFeedback

const DRAFT_DEBOUNCE_MS = 2500;
const DRAFT_KEY = 'entry-draft-new';

// These functions are now async and depend on encryptionKey
// They will be passed down via useCallback or similar to avoid re-creation issues
// Actual implementation will be inside the component

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
  const { encryptionKey } = useAuth(); // Get encryptionKey from AuthContext
  const triggerHaptic = useHapticFeedback(); // Initialize haptic feedback hook

  const editId = searchParams.get('id');
  const prefillDate = searchParams.get('date');
  const prefillTemplate = searchParams.get('template');

  // State for form fields
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(prefillDate || '');
  const [content, setContent] = useState('');
  const [template, setTemplate] = useState('');
  const [tags, setTags] = useState([]);
  const [loadingEntry, setLoadingEntry] = useState(!!editId);
  const [hasDraft, setHasDraft] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(true); // New state for draft loading

  const saveTimerRef = useRef(null);

  // Secure draft functions
  const saveEncryptedDraft = useCallback(async (draftToSave) => {
    if (!encryptionKey) {
      console.warn('E2E encryption key not available. Cannot securely save draft.');
      // Optionally alert user or display a message
      return;
    }
    try {
      const encryptedDraft = await encryptData(draftToSave, encryptionKey);
      localStorage.setItem(DRAFT_KEY, JSON.stringify(encryptedDraft));
      setHasDraft(true);
    } catch (e) {
      console.error('Failed to save encrypted draft:', e);
    }
  }, [encryptionKey]);

  const loadEncryptedDraft = useCallback(async () => {
    if (!encryptionKey) {
      console.warn('E2E encryption key not available. Cannot load encrypted draft.');
      setLoadingDraft(false); // Finished trying to load
      return null;
    }
    try {
      const stored = localStorage.getItem(DRAFT_KEY);
      if (stored) {
        const encryptedDraft = JSON.parse(stored);
        const decryptedDraft = await decryptData(encryptedDraft, encryptionKey);
        setHasDraft(true);
        return decryptedDraft;
      }
    } catch (e) {
      console.warn('Failed to load or decrypt draft:', e);
      // If decryption fails, clear the corrupted draft
      localStorage.removeItem(DRAFT_KEY);
    } finally {
      setLoadingDraft(false); // Finished loading attempt
    }
    return null;
  }, [encryptionKey]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
  }, []);


  // Effect to load draft or entry on component mount/editId change
  useEffect(() => {
    const initializeForm = async () => {
      setLoadingEntry(true); // Start loading

      if (editId) {
        const entry = await getEntryById(editId);
        if (!entry) {
          alert('Entry not found.');
          navigate('/journal');
          return;
        }
        if (entry.isDecrypted === false) {
            alert(entry.decryptionError || 'This entry is encrypted and could not be decrypted.');
            navigate('/journal');
            return;
        }
        setTitle(entry.title);
        setDate(entry.date);
        setContent(entry.content);
        setTags(entry.tags || []);
        setTemplate(''); // No template for existing entry
        setLoadingEntry(false);
      } else {
        // Not editing, try to load draft
        const draft = await loadEncryptedDraft();
        if (draft) {
          setTitle(draft.title || '');
          setDate(draft.date || prefillDate || '');
          setContent(draft.content || '');
          setTemplate(draft.template || '');
          setTags(draft.tags || []);
        } else {
          // No draft, set defaults
          setTitle('');
          setDate(prefillDate || '');
          setContent('');
          setTemplate('');
          setTags([]);
        }
        setLoadingEntry(false);
      }
    };
    initializeForm();
  }, [editId, getEntryById, navigate, prefillDate, loadEncryptedDraft]); // Added loadEncryptedDraft to deps

  // Effect to apply template content if selected
  useEffect(() => {
    if (!editId && prefillTemplate && TEMPLATES[prefillTemplate] && !content) { // Only apply if content is empty
      setTemplate(prefillTemplate);
      setContent(TEMPLATES[prefillTemplate]);
    }
  }, [prefillTemplate, editId, content]);


  // Effect for auto-saving drafts
  useEffect(() => {
    if (editId) return; // Don't auto-save drafts when editing an existing entry

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    const hasContent = title.trim() || content.trim() || date || tags.length > 0;

    if (!hasContent) {
      clearDraft();
      setHasDraft(false);
      return;
    }

    saveTimerRef.current = setTimeout(async () => { // Made async here
      await saveEncryptedDraft({ title, date, content, template, tags });
      // setHasDraft(true); // Handled inside saveEncryptedDraft
    }, DRAFT_DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [title, date, content, template, tags, editId, saveEncryptedDraft, clearDraft]);


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
      return false; // Return false to indicate submission failure
    }
    if (!encryptionKey) {
        alert('E2E encryption is not unlocked. Cannot save or update entry securely.');
        return false;
    }


    if (editId) {
      const success = await updateEntry(editId, {
        title: title.trim(),
        date,
        content: content.trim(),
        tags,
      });
      if (success) {
        triggerHaptic(); // Trigger haptic feedback on success
        clearDraft(); // Clear draft on successful save/update
        navigate('/journal');
      }
    } else {
      const success = await addEntry({
        title: title.trim(),
        date,
        content: content.trim(),
        tags,
      });
      if (success) {
        triggerHaptic(); // Trigger haptic feedback on success
        clearDraft(); // Clear draft on successful save/update
        navigate('/journal');
      }
    }
  };

  const handleDiscardDraft = () => {
    clearDraft();
    setTitle('');
    setDate(prefillDate || '');
    setContent('');
    setTemplate('');
    setTags([]);
    setHasDraft(false);
  };

  if (loadingEntry || loadingDraft) { // Added loadingDraft
    return <p className="muted">Loading entry and draft...</p>;
  }

  // If E2E is not unlocked, show a message and prevent editing/saving
  if (!encryptionKey) {
    return (
      <>
        <div className="page-header">
            <div>
                <p className="eyebrow">{editId ? 'Update' : 'Create'}</p>
                <h2>{editId ? 'Edit Entry' : 'Add a New Entry'}</h2>
                <p className="muted">
                    Your journal is currently locked. Please unlock E2E encryption to manage entries.
                </p>
            </div>
            <Link className="btn ghost" to="/journal">Back to journal</Link>
        </div>
        <div className="form-card">
            <p className="danger-text">
                E2E encryption is not unlocked. You cannot create or edit entries securely.
                Please provide your master password to continue.
            </p>
        </div>
      </>
    );
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

      {hasDraft && !editId && (
        <div className="draft-indicator">
          <span className="draft-indicator__text">Draft saved securely</span>
          <button
            type="button"
            className="draft-indicator__discard"
            onClick={handleDiscardDraft}
          >
            Discard draft
          </button>
        </div>
      )}

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

          <label>Tags</label>
          <TagInput tags={tags} onChange={setTags} placeholder="Add tags (press Enter or comma)" />

          <button className="btn primary" type="submit">
            {editId ? 'Update Entry' : 'Save Entry'}
          </button>
        </form>
      </section>
    </>
  );
}
