import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Square,
  Globe,
  HelpCircle,
  AlertCircle,
  Check,
  ChevronDown,
  X,
  Sparkles,
} from 'lucide-react';
import { SPEECH_LANGUAGES } from '../hooks/useSpeechRecognition';

interface VoiceDictationBarProps {
  isListening: boolean;
  interimTranscript: string;
  duration: number;
  selectedLanguage: string;
  onChangeLanguage: (lang: string) => void;
  smartPunctuation: boolean;
  onToggleSmartPunctuation: (enabled: boolean) => void;
  onStop: () => void;
  error: string | null;
  onClearError: () => void;
  isSupported: boolean;
}

export const VoiceDictationBar: React.FC<VoiceDictationBarProps> = ({
  isListening,
  interimTranscript,
  duration,
  selectedLanguage,
  onChangeLanguage,
  smartPunctuation,
  onToggleSmartPunctuation,
  onStop,
  error,
  onClearError,
  isSupported,
}) => {
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement | null>(null);
  const langCloseTimerRef = useRef<number | null>(null);

  const handleLangMouseEnter = () => {
    if (langCloseTimerRef.current) {
      clearTimeout(langCloseTimerRef.current);
      langCloseTimerRef.current = null;
    }
    setIsLangMenuOpen(true);
  };

  const handleLangMouseLeave = () => {
    if (langCloseTimerRef.current) {
      clearTimeout(langCloseTimerRef.current);
    }
    langCloseTimerRef.current = window.setTimeout(() => {
      setIsLangMenuOpen(false);
      langCloseTimerRef.current = null;
    }, 180);
  };

  const closeLangImmediately = () => {
    if (langCloseTimerRef.current) {
      clearTimeout(langCloseTimerRef.current);
      langCloseTimerRef.current = null;
    }
    setIsLangMenuOpen(false);
  };

  useEffect(() => {
    if (!isLangMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        closeLangImmediately();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isLangMenuOpen]);

  // Format seconds to MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  const currentLangObj = SPEECH_LANGUAGES.find((l) => l.code === selectedLanguage) || SPEECH_LANGUAGES[0];

  if (!isListening && !error) {
    return null;
  }

  return (
    <div
      id="voice-dictation-live-overlay"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4 animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      <div className="bg-[#150d24]/95 backdrop-blur-xl border border-[#ec4899]/60 rounded-xl shadow-2xl p-3.5 text-[#faf5ff] ring-1 ring-black/60">
        {/* Error message banner */}
        {error ? (
          <div className="flex items-start justify-between gap-3 text-xs text-rose-300 bg-rose-950/40 border border-rose-500/40 rounded-lg p-2.5">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-rose-200">Voice Recognition Alert</div>
                <p className="text-[11px] text-rose-300/90 mt-0.5">{error}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClearError}
              className="p-1 text-rose-400 hover:text-white rounded hover:bg-rose-900/50 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div>
            {/* Header: Status, Timer, Language, Smart Punctuation, Stop */}
            <div className="flex items-center justify-between gap-2 border-b border-[#2e1c52]/80 pb-2.5 mb-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Pulsing Recording Indicator */}
                <div className="relative flex items-center justify-center shrink-0">
                  <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping absolute opacity-75" />
                  <span className="w-3 h-3 rounded-full bg-rose-500 relative" />
                </div>

                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-semibold tracking-wide text-[#faf5ff] font-['Space_Grotesk',sans-serif]">
                    Listening...
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] font-mono bg-[#1f1338] text-[#ec4899] rounded border border-[#2e1c52]">
                    {formatTime(duration)}
                  </span>
                </div>

                {/* Animated Audio Equalizer Bars */}
                <div className="flex items-center gap-0.5 h-3 px-1 shrink-0">
                  <span className="w-1 bg-[#ec4899] rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-2" />
                  <span className="w-1 bg-[#c084fc] rounded-full animate-[pulse_0.4s_ease-in-out_infinite] h-3.5" />
                  <span className="w-1 bg-[#ec4899] rounded-full animate-[pulse_0.8s_ease-in-out_infinite] h-1.5" />
                  <span className="w-1 bg-[#c084fc] rounded-full animate-[pulse_0.5s_ease-in-out_infinite] h-3" />
                  <span className="w-1 bg-[#ec4899] rounded-full animate-[pulse_0.7s_ease-in-out_infinite] h-2" />
                </div>
              </div>

              {/* Action items on right */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Language Picker Dropdown */}
                <div
                  className="relative"
                  ref={langMenuRef}
                  onMouseEnter={handleLangMouseEnter}
                  onMouseLeave={handleLangMouseLeave}
                >
                  <button
                    type="button"
                    onClick={() => setIsLangMenuOpen((prev) => !prev)}
                    className="flex items-center gap-1 px-2 py-1 text-[11px] rounded-[6px] bg-[#1f1338] hover:bg-[#281745] text-[#c084fc] hover:text-[#faf5ff] border border-[#2e1c52] transition-colors cursor-pointer"
                    title="Change Speech Recognition Language"
                  >
                    <span>{currentLangObj.flag}</span>
                    <span className="hidden sm:inline font-mono">{currentLangObj.code}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${isLangMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isLangMenuOpen && (
                    <div
                      className="absolute right-0 bottom-full mb-1.5 w-48 bg-[#150d24] border border-[#3b2366] rounded-lg shadow-2xl py-1 z-50 max-h-56 overflow-y-auto ring-1 ring-black/50"
                      onMouseEnter={handleLangMouseEnter}
                      onMouseLeave={handleLangMouseLeave}
                    >
                      <div className="px-2.5 py-1 text-[10px] font-semibold text-[#c084fc]/70 uppercase tracking-wider font-['Space_Mono',monospace] border-b border-[#2e1c52]/60 mb-0.5">
                        Speech Language
                      </div>
                      {SPEECH_LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => {
                            onChangeLanguage(lang.code);
                            closeLangImmediately();
                          }}
                          className={`w-full px-2.5 py-1.5 text-left text-xs flex items-center justify-between hover:bg-[#1f1338] transition-colors cursor-pointer ${
                            selectedLanguage === lang.code ? 'text-[#ec4899] font-semibold' : 'text-[#faf5ff]'
                          }`}
                        >
                          <span className="flex items-center gap-2 truncate">
                            <span>{lang.flag}</span>
                            <span className="truncate">{lang.name}</span>
                          </span>
                          {selectedLanguage === lang.code && <Check className="w-3.5 h-3.5 text-[#ec4899] shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Smart Punctuation toggle */}
                <button
                  type="button"
                  onClick={() => onToggleSmartPunctuation(!smartPunctuation)}
                  className={`flex items-center gap-1 px-2 py-1 text-[11px] rounded-[6px] transition-colors cursor-pointer border ${
                    smartPunctuation
                      ? 'bg-[#ec4899]/15 border-[#ec4899]/60 text-[#faf5ff]'
                      : 'bg-[#1f1338] border-[#2e1c52] text-[#c084fc]/70 hover:text-[#faf5ff]'
                  }`}
                  title="Smart Punctuation: Automatically converts spoken 'period', 'comma', 'new line', 'task' into markdown characters"
                >
                  <Sparkles className="w-3 h-3 text-[#ec4899]" />
                  <span className="hidden sm:inline font-mono text-[10px]">Punctuation</span>
                </button>

                {/* Voice Commands Help Dialog Button */}
                <button
                  type="button"
                  onClick={() => setIsHelpOpen((prev) => !prev)}
                  className="p-1 text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#1f1338] rounded transition-colors cursor-pointer"
                  title="Voice Commands Guide"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>

                {/* Stop Dictating Button */}
                <button
                  id="btn-voice-dictation-stop"
                  type="button"
                  onClick={onStop}
                  className="flex items-center gap-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-[6px] text-xs font-semibold shadow-xs hover:shadow-rose-600/30 transition-all cursor-pointer active:scale-95 ml-1"
                  title="Stop Dictating (or press Esc)"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>Done</span>
                  <kbd className="text-[9px] font-mono opacity-80 bg-rose-700 px-1 py-0.2 rounded">Esc</kbd>
                </button>
              </div>
            </div>

            {/* Live interim speech preview */}
            <div className="min-h-7 max-h-24 overflow-y-auto px-2 py-1 rounded bg-[#0c0714]/80 border border-[#2e1c52]/60 text-xs text-[#faf5ff]/90 flex items-center">
              {interimTranscript ? (
                <p className="italic text-[#faf5ff] font-['Space_Grotesk',sans-serif]">
                  "{interimTranscript}"
                </p>
              ) : (
                <p className="text-[#c084fc]/60 text-[11px] font-mono flex items-center gap-1.5">
                  <Mic className="w-3 h-3 text-[#ec4899] animate-pulse" />
                  Speak naturally... Your words will be inserted into the note at cursor.
                </p>
              )}
            </div>

            {/* Punctuation Guide Dropdown/Popover */}
            {isHelpOpen && (
              <div className="mt-2.5 pt-2 border-t border-[#2e1c52]/80 text-[11px] text-[#c084fc] font-['Space_Grotesk',sans-serif]">
                <div className="font-semibold text-[#faf5ff] mb-1 flex items-center justify-between">
                  <span>Spoken Voice Commands</span>
                  <button
                    type="button"
                    onClick={() => setIsHelpOpen(false)}
                    className="text-[10px] text-[#c084fc] hover:text-[#faf5ff] cursor-pointer"
                  >
                    Close
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-[10px] font-mono">
                  <div><span className="text-[#ec4899]">"period"</span> → <span className="text-[#faf5ff]">.</span></div>
                  <div><span className="text-[#ec4899]">"comma"</span> → <span className="text-[#faf5ff]">,</span></div>
                  <div><span className="text-[#ec4899]">"question mark"</span> → <span className="text-[#faf5ff]">?</span></div>
                  <div><span className="text-[#ec4899]">"exclamation mark"</span> → <span className="text-[#faf5ff]">!</span></div>
                  <div><span className="text-[#ec4899]">"new line"</span> → <span className="text-[#faf5ff]">↵ Enter</span></div>
                  <div><span className="text-[#ec4899]">"new paragraph"</span> → <span className="text-[#faf5ff]">↵↵</span></div>
                  <div><span className="text-[#ec4899]">"bullet point"</span> → <span className="text-[#faf5ff]">- </span></div>
                  <div><span className="text-[#ec4899]">"new task"</span> → <span className="text-[#faf5ff]">- [ ] </span></div>
                  <div><span className="text-[#ec4899]">"colon"</span> → <span className="text-[#faf5ff]">:</span></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
