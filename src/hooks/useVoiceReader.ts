import { useState, useEffect, useRef, useCallback } from 'react';
import { cleanMarkdownForSpeech, splitIntoSentences, SpeechSentence } from '../utils/textToSpeechCleaner';

export interface UseVoiceReaderOptions {
  onSentenceChange?: (sentence: SpeechSentence, index: number, total: number) => void;
  onFinish?: () => void;
  onError?: (err: string) => void;
}

export function useVoiceReader(options: UseVoiceReaderOptions = {}) {
  const { onSentenceChange, onFinish, onError } = options;

  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>(() => {
    return localStorage.getItem('mf_tts_voice_uri') || '';
  });
  const [rate, setRateState] = useState<number>(() => {
    const saved = localStorage.getItem('mf_tts_rate');
    return saved ? parseFloat(saved) : 1.0;
  });
  const [pitch, setPitchState] = useState<number>(() => {
    const saved = localStorage.getItem('mf_tts_pitch');
    return saved ? parseFloat(saved) : 1.0;
  });

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [sentences, setSentences] = useState<SpeechSentence[]>([]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState<number>(0);
  const [readSourceType, setReadSourceType] = useState<'all' | 'selection'>('all');
  const [error, setError] = useState<string | null>(null);

  // Active utterance reference
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isCancelledRef = useRef<boolean>(false);
  const currentIndexRef = useRef<number>(0);
  const sentencesRef = useRef<SpeechSentence[]>([]);
  const rateRef = useRef<number>(rate);
  const pitchRef = useRef<number>(pitch);
  const selectedVoiceURIRef = useRef<string>(selectedVoiceURI);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  // Keep refs synced
  useEffect(() => {
    rateRef.current = rate;
  }, [rate]);

  useEffect(() => {
    pitchRef.current = pitch;
  }, [pitch]);

  useEffect(() => {
    selectedVoiceURIRef.current = selectedVoiceURI;
  }, [selectedVoiceURI]);

  useEffect(() => {
    sentencesRef.current = sentences;
  }, [sentences]);

  useEffect(() => {
    currentIndexRef.current = currentSentenceIndex;
  }, [currentSentenceIndex]);

  useEffect(() => {
    voicesRef.current = voices;
  }, [voices]);

  // Check speech synthesis support and load voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSupported(false);
      return;
    }

    const updateVoices = () => {
      const available = window.speechSynthesis.getVoices();
      if (available && available.length > 0) {
        setVoices(available);
        voicesRef.current = available;

        // If no voice selected, pick a high quality default
        if (!selectedVoiceURIRef.current) {
          const preferred =
            available.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel'))) ||
            available.find((v) => v.default) ||
            available[0];
          if (preferred) {
            setSelectedVoiceURI(preferred.voiceURI);
            selectedVoiceURIRef.current = preferred.voiceURI;
          }
        }
      }
    };

    updateVoices();

    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    return () => {
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Set rate with persistence
  const setRate = useCallback((newRate: number) => {
    setRateState(newRate);
    rateRef.current = newRate;
    localStorage.setItem('mf_tts_rate', String(newRate));
  }, []);

  // Set pitch with persistence
  const setPitch = useCallback((newPitch: number) => {
    setPitchState(newPitch);
    pitchRef.current = newPitch;
    localStorage.setItem('mf_tts_pitch', String(newPitch));
  }, []);

  // Set voice with persistence
  const setVoice = useCallback((voiceURI: string) => {
    setSelectedVoiceURI(voiceURI);
    selectedVoiceURIRef.current = voiceURI;
    localStorage.setItem('mf_tts_voice_uri', voiceURI);
  }, []);

  // Internal function to speak a single sentence by index
  const speakSentenceAt = useCallback(
    (index: number) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

      const currentList = sentencesRef.current;
      if (index >= currentList.length) {
        // Done with all sentences
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentSentenceIndex(0);
        currentIndexRef.current = 0;
        onFinish?.();
        return;
      }

      if (isCancelledRef.current) return;

      window.speechSynthesis.cancel();

      const item = currentList[index];
      setCurrentSentenceIndex(index);
      currentIndexRef.current = index;
      onSentenceChange?.(item, index, currentList.length);

      const utterance = new SpeechSynthesisUtterance(item.text);
      utteranceRef.current = utterance;
      utterance.rate = rateRef.current;
      utterance.pitch = pitchRef.current;

      // Match voice
      const activeVoiceURI = selectedVoiceURIRef.current;
      if (activeVoiceURI && voicesRef.current.length > 0) {
        const found = voicesRef.current.find((v) => v.voiceURI === activeVoiceURI);
        if (found) utterance.voice = found;
      }

      utterance.onend = () => {
        if (isCancelledRef.current) return;
        // Proceed to next sentence
        const nextIdx = index + 1;
        speakSentenceAt(nextIdx);
      };

      utterance.onerror = (e) => {
        // 'interrupted' or 'canceled' are normal when user skips, stops, or pauses
        const errStr = String(e.error);
        if (errStr === 'interrupted' || errStr === 'canceled') {
          return;
        }
        console.warn('Voice reader utterance error:', e.error);
        setError(`Playback error: ${e.error}`);
        onError?.(String(e.error));
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'Speech synthesis failed';
        setError(errMsg);
        setIsPlaying(false);
        setIsPaused(false);
      }
    },
    [onFinish, onSentenceChange, onError]
  );

  // Play from text or active note content
  const play = useCallback(
    (params?: { text?: string; title?: string; isSelection?: boolean; startIndex?: number }) => {
      if (!isSupported) {
        setError('Voice Reader is not supported in this browser.');
        return;
      }

      setError(null);
      isCancelledRef.current = false;

      let sentenceList: SpeechSentence[] = sentencesRef.current;

      // If new text provided or no sentences parsed yet
      if (params?.text !== undefined || sentenceList.length === 0) {
        const raw = params?.text || '';
        const clean = cleanMarkdownForSpeech(raw, params?.isSelection ? undefined : params?.title);
        const parsed = splitIntoSentences(clean);

        if (parsed.length === 0) {
          setError('No readable text found in this note.');
          return;
        }

        sentenceList = parsed;
        setSentences(parsed);
        sentencesRef.current = parsed;
        setReadSourceType(params?.isSelection ? 'selection' : 'all');
      }

      const startIdx = params?.startIndex !== undefined ? params.startIndex : 0;
      setIsPlaying(true);
      setIsPaused(false);
      speakSentenceAt(startIdx);
    },
    [isSupported, speakSentenceAt]
  );

  // Pause speech
  const pause = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isPlaying && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [isPlaying, isPaused]);

  // Resume speech
  const resume = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else if (!isPlaying && sentencesRef.current.length > 0) {
      // Re-trigger from current index
      isCancelledRef.current = false;
      setIsPlaying(true);
      speakSentenceAt(currentIndexRef.current);
    }
  }, [isPaused, isPlaying, speakSentenceAt]);

  // Toggle play/pause
  const togglePlayPause = useCallback(
    (params?: { text?: string; title?: string; isSelection?: boolean }) => {
      if (isPlaying) {
        if (isPaused) {
          resume();
        } else {
          pause();
        }
      } else {
        play(params);
      }
    },
    [isPlaying, isPaused, play, pause, resume]
  );

  // Stop speech completely and reset
  const stop = useCallback(() => {
    isCancelledRef.current = true;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentSentenceIndex(0);
    currentIndexRef.current = 0;
  }, []);

  // Skip to next sentence
  const skipForward = useCallback(() => {
    const nextIdx = currentIndexRef.current + 1;
    if (nextIdx < sentencesRef.current.length) {
      isCancelledRef.current = false;
      speakSentenceAt(nextIdx);
    } else {
      stop();
    }
  }, [speakSentenceAt, stop]);

  // Skip to previous sentence
  const skipBackward = useCallback(() => {
    const prevIdx = Math.max(0, currentIndexRef.current - 1);
    isCancelledRef.current = false;
    speakSentenceAt(prevIdx);
  }, [speakSentenceAt]);

  // Seek to specific sentence
  const seekSentence = useCallback(
    (index: number) => {
      const target = Math.max(0, Math.min(sentencesRef.current.length - 1, index));
      isCancelledRef.current = false;
      speakSentenceAt(target);
    },
    [speakSentenceAt]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isCancelledRef.current = true;
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const currentSentence = sentences[currentSentenceIndex] || null;
  const progress = sentences.length > 0 ? ((currentSentenceIndex + 1) / sentences.length) * 100 : 0;

  return {
    isSupported,
    isPlaying,
    isPaused,
    currentSentenceIndex,
    totalSentences: sentences.length,
    currentSentence,
    progress,
    rate,
    pitch,
    selectedVoiceURI,
    voices,
    readSourceType,
    error,
    clearError: () => setError(null),
    play,
    pause,
    resume,
    stop,
    togglePlayPause,
    skipForward,
    skipBackward,
    seekSentence,
    setRate,
    setPitch,
    setVoice,
  };
}
