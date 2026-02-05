import { useState, useRef, useEffect, useCallback } from 'react';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

// Utility functions for audio conversion
async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(base64, mimeType = 'audio/webm') {
  const byteChars = atob(base64);
  const byteArrays = [];
  for (let i = 0; i < byteChars.length; i += 512) {
    const slice = byteChars.slice(i, i + 512);
    const byteNumbers = new Array(slice.length);
    for (let j = 0; j < slice.length; j++) {
      byteNumbers[j] = slice.charCodeAt(j);
    }
    byteArrays.push(new Uint8Array(byteNumbers));
  }
  return new Blob(byteArrays, { type: mimeType });
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function generateId() {
  return `vn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Individual voice note item component
function VoiceNoteItem({ note, onDelete, onAppendTranscript }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const triggerHaptic = useHapticFeedback();

  useEffect(() => {
    if (note.audioBase64) {
      const blob = base64ToBlob(note.audioBase64, 'audio/webm');
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [note.audioBase64]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  const handleDelete = () => {
    triggerHaptic();
    onDelete();
  };

  const handleAppendTranscript = () => {
    if (note.transcript) {
      triggerHaptic();
      onAppendTranscript(note.transcript);
    }
  };

  return (
    <div className="voice-note-item">
      <div className="voice-note-item__main">
        <div className="voice-note-item__controls">
          <button
            type="button"
            className="voice-note-item__play-btn"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <span className="voice-note-item__duration">
            {formatDuration(note.duration)}
          </span>
          {audioUrl && (
            <audio
              ref={audioRef}
              src={audioUrl}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
            />
          )}
        </div>

        {note.transcript && (
          <div className="voice-note-item__transcript">
            "{note.transcript.trim()}"
          </div>
        )}
      </div>

      <div className="voice-note-item__actions">
        {note.transcript && (
          <button
            type="button"
            className="voice-note-item__action-btn"
            onClick={handleAppendTranscript}
            title="Add transcript to entry content"
          >
            + Add text
          </button>
        )}
        <button
          type="button"
          className="voice-note-item__action-btn voice-note-item__action-btn--delete"
          onClick={handleDelete}
          title="Delete voice note"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

// Main VoiceRecorder component
export default function VoiceRecorder({ notes = [], onChange, onTranscript, disabled }) {
  const {
    isRecording,
    duration,
    audioBlob,
    error: recorderError,
    isSupported: recorderSupported,
    startRecording,
    stopRecording,
    resetRecording,
    maxDuration,
  } = useVoiceRecorder();

  const {
    fullTranscript,
    transcript: finalTranscript,
    isTranscribing,
    isSupported: speechSupported,
    error: speechError,
    startTranscription,
    stopTranscription,
    resetTranscript,
  } = useSpeechToText();

  const triggerHaptic = useHapticFeedback();
  const [pendingTranscript, setPendingTranscript] = useState('');

  // When recording stops and we have audio, save the note
  useEffect(() => {
    if (!isRecording && audioBlob) {
      saveVoiceNote();
    }
  }, [isRecording, audioBlob]);

  // Track transcript during recording
  useEffect(() => {
    if (isRecording && fullTranscript) {
      setPendingTranscript(fullTranscript);
    }
  }, [isRecording, fullTranscript]);

  const handleStartRecording = async () => {
    if (disabled) return;

    triggerHaptic();
    resetRecording();
    resetTranscript();
    setPendingTranscript('');

    const started = await startRecording();
    if (started && speechSupported) {
      startTranscription();
    }
  };

  const handleStopRecording = () => {
    triggerHaptic();
    stopRecording();
    stopTranscription();
  };

  const saveVoiceNote = async () => {
    if (!audioBlob) return;

    try {
      const base64 = await blobToBase64(audioBlob);
      const newNote = {
        id: generateId(),
        audioBase64: base64,
        duration: duration,
        transcript: finalTranscript.trim() || pendingTranscript.trim(),
        timestamp: new Date().toISOString(),
      };

      onChange([...notes, newNote]);
      resetRecording();
      resetTranscript();
      setPendingTranscript('');
    } catch (err) {
      console.error('Failed to save voice note:', err);
    }
  };

  const handleDeleteNote = (id) => {
    onChange(notes.filter(note => note.id !== id));
  };

  const handleAppendTranscript = (text) => {
    if (onTranscript && text) {
      onTranscript(text);
    }
  };

  // Not supported
  if (!recorderSupported) {
    return (
      <div className="voice-recorder voice-recorder--unsupported">
        <p className="muted">Voice recording is not supported in this browser.</p>
      </div>
    );
  }

  const error = recorderError || speechError;

  return (
    <div className="voice-recorder">
      {/* Recording controls */}
      <div className="voice-recorder__controls">
        {!isRecording ? (
          <button
            type="button"
            className="voice-recorder__record-btn"
            onClick={handleStartRecording}
            disabled={disabled}
          >
            <span className="voice-recorder__record-icon">🎤</span>
            Record Voice Note
          </button>
        ) : (
          <button
            type="button"
            className="voice-recorder__record-btn voice-recorder__record-btn--recording"
            onClick={handleStopRecording}
          >
            <span className="voice-recorder__record-icon">⏹</span>
            Stop Recording
          </button>
        )}

        {isRecording && (
          <span className="voice-recorder__timer">
            {formatDuration(duration)} / {formatDuration(maxDuration)}
          </span>
        )}

        {!speechSupported && !isRecording && (
          <span className="voice-recorder__hint muted">
            (Transcription unavailable in this browser)
          </span>
        )}
      </div>

      {/* Live transcription preview */}
      {isRecording && isTranscribing && fullTranscript && (
        <div className="voice-recorder__transcript-preview">
          <span className="voice-recorder__transcript-label">Transcribing:</span>
          <span className="voice-recorder__transcript-text">{fullTranscript}</span>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="voice-recorder__error">
          {error}
        </div>
      )}

      {/* Voice notes list */}
      {notes.length > 0 && (
        <div className="voice-recorder__notes">
          {notes.map(note => (
            <VoiceNoteItem
              key={note.id}
              note={note}
              onDelete={() => handleDeleteNote(note.id)}
              onAppendTranscript={handleAppendTranscript}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Export utilities for use elsewhere
export { base64ToBlob, blobToBase64 };
