import { useState, useEffect, useRef, useCallback } from 'react';

export interface SpeechLanguage {
  code: string;
  name: string;
  flag: string;
}

export const SPEECH_LANGUAGES: SpeechLanguage[] = [
  { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
  { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧' },
  { code: 'es-ES', name: 'Spanish (Spain)', flag: '🇪🇸' },
  { code: 'es-MX', name: 'Spanish (Mexico)', flag: '🇲🇽' },
  { code: 'fr-FR', name: 'French', flag: '🇫🇷' },
  { code: 'de-DE', name: 'German', flag: '🇩🇪' },
  { code: 'it-IT', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt-BR', name: 'Portuguese (BR)', flag: '🇧🇷' },
  { code: 'ja-JP', name: 'Japanese', flag: '🇯🇵' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', flag: '🇨🇳' },
  { code: 'ar-SA', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi-IN', name: 'Hindi', flag: '🇮🇳' },
  { code: 'ru-RU', name: 'Russian', flag: '🇷🇺' },
  { code: 'ko-KR', name: 'Korean', flag: '🇰🇷' },
  { code: 'nl-NL', name: 'Dutch', flag: '🇳🇱' },
];

export function formatSpeechTranscript(raw: string, smartPunctuation: boolean): string {
  if (!smartPunctuation) return raw;

  let text = raw;

  // Replacements for punctuation commands (case insensitive)
  const punctuationRules: [RegExp, string][] = [
    [/\b(new paragraph|next paragraph)\b/gi, '\n\n'],
    [/\b(new line|next line)\b/gi, '\n'],
    [/\b(bullet point|new bullet)\b/gi, '\n- '],
    [/\b(new task|checkbox task|task checkbox|add task)\b/gi, '\n- [ ] '],
    [/\b(full stop|period)\b/gi, '.'],
    [/\b(comma)\b/gi, ','],
    [/\b(question mark)\b/gi, '?'],
    [/\b(exclamation mark|exclamation point)\b/gi, '!'],
    [/\b(colon)\b/gi, ':'],
    [/\b(semicolon)\b/gi, ';'],
    [/\b(open quote|start quote)\b/gi, '"'],
    [/\b(close quote|end quote)\b/gi, '"'],
    [/\b(dash|hyphen)\b/gi, '-'],
    [/\b(open parenthesis|open paren)\b/gi, '('],
    [/\b(close parenthesis|close paren)\b/gi, ')'],
  ];

  for (const [regex, replacement] of punctuationRules) {
    text = text.replace(regex, replacement);
  }

  // Clean up formatting artifacts:
  // Remove space before punctuation: "word ." -> "word."
  text = text.replace(/\s+([.,!?:;)])/g, '$1');
  // Remove space after open paren: "( word" -> "(word"
  text = text.replace(/([(])\s+/g, '$1');
  // Ensure single space after punctuation if followed by word (and not newline)
  text = text.replace(/([.,!?:;])([A-Za-z0-9])/g, '$1 $2');

  return text;
}

interface UseSpeechRecognitionOptions {
  onFinalResult?: (transcript: string) => void;
  onInterimResult?: (transcript: string) => void;
}

export function useSpeechRecognition(options?: UseSpeechRecognitionOptions) {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);

  // Load language preference
  const [selectedLanguage, setSelectedLanguageState] = useState<string>(() => {
    try {
      return localStorage.getItem('mf_voice_language') || 'en-US';
    } catch {
      return 'en-US';
    }
  });

  // Load smart punctuation preference
  const [smartPunctuation, setSmartPunctuationState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('mf_smart_punctuation');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const setSelectedLanguage = useCallback((lang: string) => {
    setSelectedLanguageState(lang);
    try {
      localStorage.setItem('mf_voice_language', lang);
    } catch {
      // ignore
    }
  }, []);

  const setSmartPunctuation = useCallback((enabled: boolean) => {
    setSmartPunctuationState(enabled);
    try {
      localStorage.setItem('mf_smart_punctuation', String(enabled));
    } catch {
      // ignore
    }
  }, []);

  const recognitionRef = useRef<any>(null);
  const isManuallyStoppedRef = useRef(false);
  const timerRef = useRef<any>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Check support
  const isSupported = typeof window !== 'undefined' && (
    'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  );

  // Timer while listening
  useEffect(() => {
    if (isListening) {
      setAudioDuration(0);
      timerRef.current = setInterval(() => {
        setAudioDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isListening]);

  const stopListening = useCallback(() => {
    isManuallyStoppedRef.current = true;
    setIsListening(false);
    setInterimTranscript('');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    setError(null);
    setInterimTranscript('');
    isManuallyStoppedRef.current = false;

    try {
      const SpeechRecognitionAPI =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      // Clean up previous instance
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }

      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLanguage;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let finalChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          const transcriptPiece = result[0].transcript;
          if (result.isFinal) {
            finalChunk += transcriptPiece;
          } else {
            currentInterim += transcriptPiece;
          }
        }

        if (finalChunk) {
          const formatted = formatSpeechTranscript(finalChunk, smartPunctuation);
          optionsRef.current?.onFinalResult?.(formatted);
          setInterimTranscript('');
        } else {
          setInterimTranscript(currentInterim);
          optionsRef.current?.onInterimResult?.(currentInterim);
        }
      };

      recognition.onerror = (event: any) => {
        // 'no-speech' is a common benign event when silent
        if (event.error === 'no-speech') {
          return;
        }
        if (event.error === 'not-allowed') {
          setError('Microphone access denied. Please click the microphone icon in your browser address bar to allow audio access.');
          setIsListening(false);
          return;
        }
        if (event.error === 'network') {
          setError('Speech network error. Please check your internet connection.');
          setIsListening(false);
          return;
        }
        setError(`Speech recognition notice: ${event.error}`);
      };

      recognition.onend = () => {
        // If recognition ended due to silence but was not manually stopped, restart automatically
        if (!isManuallyStoppedRef.current) {
          try {
            recognition.start();
            return;
          } catch {
            // failed to restart, mark stopped
          }
        }
        setIsListening(false);
        setInterimTranscript('');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition', err);
      setError(err?.message || 'Failed to initialize speech recognition.');
      setIsListening(false);
    }
  }, [isSupported, selectedLanguage, smartPunctuation]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isManuallyStoppedRef.current = true;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    interimTranscript,
    error,
    audioDuration,
    selectedLanguage,
    setSelectedLanguage,
    smartPunctuation,
    setSmartPunctuation,
    startListening,
    stopListening,
    toggleListening,
    clearError: () => setError(null),
  };
}
