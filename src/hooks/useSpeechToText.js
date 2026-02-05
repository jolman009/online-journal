import { useState, useRef, useCallback, useEffect } from 'react';

export function useSpeechToText() {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US'; // Can be made configurable

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript + ' ';
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        setTranscript(prev => prev + final);
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        setError('Microphone permission denied for transcription');
      } else if (event.error === 'no-speech') {
        // Ignore no-speech errors, they're common
      } else if (event.error === 'network') {
        setError('Network error during transcription');
      } else {
        setError(`Transcription error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      // If still supposed to be transcribing, restart (for continuous mode)
      if (isTranscribing && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          // Ignore if already started
        }
      } else {
        setIsTranscribing(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isTranscribing]);

  const startTranscription = useCallback(() => {
    if (!isSupported || !recognitionRef.current) {
      return false;
    }

    try {
      setError(null);
      setTranscript('');
      setInterimTranscript('');
      recognitionRef.current.start();
      setIsTranscribing(true);
      return true;
    } catch (err) {
      setError('Could not start transcription: ' + err.message);
      return false;
    }
  }, [isSupported]);

  const stopTranscription = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
    }
    setIsTranscribing(false);
    setInterimTranscript('');
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  }, []);

  // Full transcript including interim results
  const fullTranscript = transcript + interimTranscript;

  return {
    transcript,           // Final transcribed text
    interimTranscript,    // Currently being processed
    fullTranscript,       // Both combined (for live display)
    isTranscribing,
    isSupported,
    error,
    startTranscription,
    stopTranscription,
    resetTranscript,
  };
}
