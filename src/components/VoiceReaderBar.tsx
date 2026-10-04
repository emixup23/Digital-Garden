import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  SkipForward,
  SkipBack,
  RotateCcw,
  Gauge,
  Sliders,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  AlertCircle,
  Headphones,
  FileText,
  Sparkles,
} from 'lucide-react';
import { SpeechSentence } from '../utils/textToSpeechCleaner';

interface VoiceReaderBarProps {
  isOpen: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  currentSentence: SpeechSentence | null;
  currentSentenceIndex: number;
  totalSentences: number;
  progress: number;
  rate: number;
  pitch: number;
  selectedVoiceURI: string;
  voices: SpeechSynthesisVoice[];
  readSourceType: 'all' | 'selection';
  error: string | null;
  noteTitle?: string;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onSkipForward: () => void;
  onSkipBackward: () => void;
  onSeek: (index: number) => void;
  onChangeRate: (rate: number) => void;
  onChangePitch: (pitch: number) => void;
  onChangeVoice: (voiceURI: string) => void;
  onClearError: () => void;
  onClose: () => void;
  isSupported: boolean;
}

const SPEED_PRESETS = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

export const VoiceReaderBar: React.FC<VoiceReaderBarProps> = ({
  isOpen,
  isPlaying,
  isPaused,
  currentSentence,
  currentSentenceIndex,
  totalSentences,
  progress,
  rate,
  pitch,
  selectedVoiceURI,
  voices,
  readSourceType,
  error,
  noteTitle,
  onPlay,
  onPause,
  onResume,
  onStop,
  onSkipForward,
  onSkipBackward,
  onSeek,
  onChangeRate,
  onChangePitch,
  onChangeVoice,
  onClearError,
  onClose,
  isSupported,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVoicePickerOpen, setIsVoicePickerOpen] = useState(false);
  const [isSpeedPickerOpen, setIsSpeedPickerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [voiceSearch, setVoiceSearch] = useState('');

  const voicePickerRef = useRef<HTMLDivElement | null>(null);
  const speedPickerRef = useRef<HTMLDivElement | null>(null);
  const settingsRef = useRef<HTMLDivElement | null>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (voicePickerRef.current && !voicePickerRef.current.contains(target)) {
        setIsVoicePickerOpen(false);
      }
      if (speedPickerRef.current && !speedPickerRef.current.contains(target)) {
        setIsSpeedPickerOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(target)) {
        setIsSettingsOpen(false);
      }
    };
    if (isVoicePickerOpen || isSpeedPickerOpen || isSettingsOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      return () => document.removeEventListener('mousedown', handleOutsideClick);
    }
  }, [isVoicePickerOpen, isSpeedPickerOpen, isSettingsOpen]);

  // Selected voice name
  const currentVoice = useMemo(() => {
    return voices.find((v) => v.voiceURI === selectedVoiceURI) || null;
  }, [voices, selectedVoiceURI]);

  // Filtered voice list
  const filteredVoices = useMemo(() => {
    if (!voiceSearch.trim()) return voices;
    const q = voiceSearch.toLowerCase();
    return voices.filter(
      (v) => v.name.toLowerCase().includes(q) || v.lang.toLowerCase().includes(q)
    );
  }, [voices, voiceSearch]);

  if (!isOpen) return null;

  if (!isSupported) {
    return (
      <div className="fixed bottom-5 right-6 z-50 max-w-md w-full bg-[#1a1030] border border-amber-500/50 rounded-xl p-4 shadow-2xl backdrop-blur-md text-amber-200 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Voice Reader (Text-to-Speech) is not supported in this browser.</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-[#251543] rounded text-[#c084fc] hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Minimized Floating Pill
  if (isMinimized) {
    return (
      <div className="fixed bottom-5 right-6 z-50 flex items-center gap-2 px-3 py-2 bg-[#150d24]/95 border border-[#ec4899]/60 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.6)] backdrop-blur-md text-[#faf5ff] animate-in fade-in slide-in-from-bottom-2 duration-200">
        {/* Animated wave */}
        <div className="flex items-center gap-0.5 h-4 px-1">
          {[1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={`w-0.5 rounded-full bg-[#ec4899] transition-all duration-150 ${
                isPlaying && !isPaused
                  ? 'animate-pulse'
                  : 'h-1 opacity-50'
              }`}
              style={{
                height: isPlaying && !isPaused ? `${8 + (i % 3) * 6}px` : '4px',
                animationDelay: `${i * 120}ms`,
              }}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => (isPlaying && !isPaused ? onPause() : onResume())}
          className="p-1.5 rounded-full bg-[#ec4899] hover:bg-[#db2777] text-white cursor-pointer active:scale-95 transition-all shadow-xs"
          title={isPlaying && !isPaused ? 'Pause' : 'Play'}
        >
          {isPlaying && !isPaused ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
        </button>

        <span className="text-xs font-mono text-[#c084fc] font-medium pr-1">
          {totalSentences > 0 ? `${currentSentenceIndex + 1}/${totalSentences}` : '0/0'}
        </span>

        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="p-1 text-[#c084fc] hover:text-white hover:bg-[#251543] rounded-full cursor-pointer transition-colors"
          title="Expand Voice Reader"
        >
          <ChevronUp className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onClose}
          className="p-1 text-[#c084fc] hover:text-rose-400 hover:bg-[#251543] rounded-full cursor-pointer transition-colors"
          title="Close Reader"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      id="voice-reader-player"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-3xl bg-[#150d24]/95 border border-[#3b2366] hover:border-[#ec4899]/70 rounded-2xl p-3.5 sm:p-4 shadow-[0_12px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl transition-all duration-200 text-[#faf5ff]"
    >
      {/* Header bar: Title, badge, and window controls */}
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#ec4899]/20 border border-[#ec4899]/40 flex items-center justify-center shrink-0">
            <Headphones className="w-3.5 h-3.5 text-[#ec4899]" />
          </div>
          <div className="flex items-center gap-2 truncate">
            <span className="text-xs font-semibold font-['Space_Mono',monospace] text-[#faf5ff] tracking-tight">
              Voice Reader
            </span>
            {noteTitle && (
              <span className="text-xs text-[#c084fc]/80 truncate max-w-[200px] sm:max-w-xs">
                — {noteTitle}
              </span>
            )}
            <span
              className={`px-2 py-0.5 text-[10px] rounded-full font-mono border font-medium ${
                readSourceType === 'selection'
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                  : 'bg-[#ec4899]/15 text-[#ec4899] border-[#ec4899]/40'
              }`}
            >
              {readSourceType === 'selection' ? 'Selection' : 'Entire Note'}
            </span>
          </div>
        </div>

        {/* Right action controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            className="p-1.5 text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#251543] rounded-lg cursor-pointer transition-colors"
            title="Minimize to mini-player"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#c084fc] hover:text-rose-400 hover:bg-[#251543] rounded-lg cursor-pointer transition-colors"
            title="Close voice reader"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error notification if any */}
      {error && (
        <div className="mb-2 px-3 py-1.5 bg-rose-950/60 border border-rose-500/40 rounded-lg text-xs text-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={onClearError}
            className="text-[10px] text-rose-400 hover:text-rose-200 underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Live Sentence Display Card */}
      <div className="mb-3 px-3 py-2 bg-[#1f1338]/80 border border-[#2e1c52] rounded-xl flex items-center gap-3">
        {/* Animated equalizer waves */}
        <div className="flex items-center gap-0.5 h-5 px-1 shrink-0">
          {[1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className={`w-0.5 rounded-full bg-[#ec4899] transition-all duration-150 ${
                isPlaying && !isPaused ? 'animate-pulse' : 'h-1.5 opacity-40'
              }`}
              style={{
                height: isPlaying && !isPaused ? `${6 + ((i * 3) % 12)}px` : '4px',
                animationDelay: `${i * 100}ms`,
              }}
            />
          ))}
        </div>

        {/* Current sentence caption */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[#faf5ff] leading-relaxed line-clamp-2 select-text font-sans">
            {currentSentence?.text || (
              <span className="italic text-[#c084fc]/60">
                Ready to read. Press play to start.
              </span>
            )}
          </p>
        </div>

        {/* Progress pill */}
        <div className="shrink-0 text-right">
          <span className="text-[11px] font-mono text-[#c084fc] font-medium">
            {totalSentences > 0 ? `${currentSentenceIndex + 1} / ${totalSentences}` : '0 / 0'}
          </span>
        </div>
      </div>

      {/* Progress scrubbing bar */}
      <div className="mb-3 flex items-center gap-2">
        <input
          type="range"
          min="0"
          max={Math.max(0, totalSentences - 1)}
          value={currentSentenceIndex}
          onChange={(e) => onSeek(parseInt(e.target.value, 10))}
          className="w-full h-1.5 bg-[#251543] rounded-lg appearance-none cursor-pointer accent-[#ec4899] hover:accent-[#f472b6]"
          title={`Seek sentence (${currentSentenceIndex + 1} of ${totalSentences})`}
        />
      </div>

      {/* Bottom Controls Row: Playback, Speed, Voice, Settings */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Playback action group */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Previous sentence */}
          <button
            type="button"
            onClick={onSkipBackward}
            disabled={currentSentenceIndex <= 0}
            className="p-2 rounded-lg bg-[#1f1338] hover:bg-[#281745] disabled:opacity-40 disabled:cursor-not-allowed text-[#c084fc] hover:text-[#faf5ff] border border-[#2e1c52] cursor-pointer transition-all active:scale-95"
            title="Previous sentence"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          {/* Main Play / Pause */}
          <button
            type="button"
            onClick={() => {
              if (isPlaying) {
                if (isPaused) onResume();
                else onPause();
              } else {
                onPlay();
              }
            }}
            className="px-4 py-2 rounded-lg bg-[#ec4899] hover:bg-[#db2777] text-white font-medium text-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-[0_0_12px_rgba(236,72,153,0.4)]"
            title={isPlaying && !isPaused ? 'Pause (Space)' : 'Play / Resume (Space)'}
          >
            {isPlaying && !isPaused ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>{isPaused ? 'Resume' : 'Listen'}</span>
              </>
            )}
          </button>

          {/* Stop / Reset */}
          <button
            type="button"
            onClick={onStop}
            disabled={!isPlaying && !isPaused && currentSentenceIndex === 0}
            className="p-2 rounded-lg bg-[#1f1338] hover:bg-[#281745] disabled:opacity-40 disabled:cursor-not-allowed text-[#c084fc] hover:text-rose-400 border border-[#2e1c52] cursor-pointer transition-all active:scale-95"
            title="Stop playback"
          >
            <Square className="w-3.5 h-3.5" />
          </button>

          {/* Next sentence */}
          <button
            type="button"
            onClick={onSkipForward}
            disabled={currentSentenceIndex >= totalSentences - 1}
            className="p-2 rounded-lg bg-[#1f1338] hover:bg-[#281745] disabled:opacity-40 disabled:cursor-not-allowed text-[#c084fc] hover:text-[#faf5ff] border border-[#2e1c52] cursor-pointer transition-all active:scale-95"
            title="Next sentence"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          {/* Replay from start */}
          <button
            type="button"
            onClick={() => onSeek(0)}
            className="p-2 rounded-lg bg-[#1f1338] hover:bg-[#281745] text-[#c084fc] hover:text-[#faf5ff] border border-[#2e1c52] cursor-pointer transition-all active:scale-95"
            title="Restart from beginning"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Voice and Speed settings */}
        <div className="flex items-center gap-2">
          {/* Speed Preset Popover */}
          <div className="relative" ref={speedPickerRef}>
            <button
              type="button"
              onClick={() => setIsSpeedPickerOpen((prev) => !prev)}
              className="h-8 px-2.5 rounded-lg bg-[#1f1338] hover:bg-[#281745] text-[#c084fc] hover:text-[#faf5ff] border border-[#2e1c52] text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              title="Playback speed"
            >
              <Gauge className="w-3.5 h-3.5 text-[#ec4899]" />
              <span>{rate}x</span>
            </button>

            {isSpeedPickerOpen && (
              <div className="absolute bottom-full mb-2 right-0 w-36 bg-[#1a1030] border border-[#3b2366] rounded-xl p-1.5 shadow-xl z-50">
                <div className="px-2 py-1 text-[10px] uppercase font-mono text-[#c084fc]/70 font-semibold border-b border-[#2e1c52]/60 mb-1">
                  Speed
                </div>
                {SPEED_PRESETS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      onChangeRate(s);
                      setIsSpeedPickerOpen(false);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono text-left flex items-center justify-between transition-colors cursor-pointer ${
                      rate === s
                        ? 'bg-[#ec4899]/20 text-[#ec4899] font-bold'
                        : 'text-[#faf5ff] hover:bg-[#251543]'
                    }`}
                  >
                    <span>{s}x</span>
                    {rate === s && <Check className="w-3 h-3 text-[#ec4899]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Voice Picker Dropdown */}
          <div className="relative" ref={voicePickerRef}>
            <button
              type="button"
              onClick={() => setIsVoicePickerOpen((prev) => !prev)}
              className="h-8 max-w-[160px] sm:max-w-[200px] px-2.5 rounded-lg bg-[#1f1338] hover:bg-[#281745] text-[#c084fc] hover:text-[#faf5ff] border border-[#2e1c52] text-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 truncate"
              title="Select voice"
            >
              <Volume2 className="w-3.5 h-3.5 text-[#ec4899] shrink-0" />
              <span className="truncate text-[11px]">
                {currentVoice ? currentVoice.name.replace(/^(Google|Microsoft|Apple)\s*/i, '') : 'Default Voice'}
              </span>
              <ChevronDown className="w-3 h-3 shrink-0 opacity-60" />
            </button>

            {isVoicePickerOpen && (
              <div className="absolute bottom-full mb-2 right-0 w-64 sm:w-72 bg-[#1a1030] border border-[#3b2366] rounded-xl p-2 shadow-2xl z-50 max-h-72 flex flex-col">
                <div className="px-2 py-1 text-[10px] uppercase font-mono text-[#c084fc]/70 font-semibold border-b border-[#2e1c52]/60 mb-2">
                  System Voices ({voices.length})
                </div>

                {/* Search voices */}
                <input
                  type="text"
                  placeholder="Filter voices..."
                  value={voiceSearch}
                  onChange={(e) => setVoiceSearch(e.target.value)}
                  className="w-full mb-2 px-2.5 py-1 text-xs bg-[#150d24] border border-[#2e1c52] rounded-lg text-[#faf5ff] placeholder-[#c084fc]/40 focus:outline-hidden focus:border-[#ec4899]"
                />

                <div className="overflow-y-auto space-y-1 flex-1 pr-1 custom-scrollbar">
                  {filteredVoices.map((v) => {
                    const isSelected = v.voiceURI === selectedVoiceURI;
                    return (
                      <button
                        key={v.voiceURI}
                        type="button"
                        onClick={() => {
                          onChangeVoice(v.voiceURI);
                          setIsVoicePickerOpen(false);
                        }}
                        className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#ec4899]/20 text-[#ec4899] font-medium'
                            : 'text-[#faf5ff] hover:bg-[#251543]'
                        }`}
                      >
                        <div className="truncate mr-2">
                          <div className="truncate font-medium">{v.name}</div>
                          <div className="text-[10px] text-[#c084fc]/70 font-mono">
                            {v.lang} {v.default ? '• Default' : ''}
                          </div>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#ec4899] shrink-0" />}
                      </button>
                    );
                  })}
                  {filteredVoices.length === 0 && (
                    <div className="py-3 text-center text-xs text-[#c084fc]/60">
                      No voices found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Extra pitch / tone slider popover */}
          <div className="relative" ref={settingsRef}>
            <button
              type="button"
              onClick={() => setIsSettingsOpen((prev) => !prev)}
              className="h-8 w-8 rounded-lg bg-[#1f1338] hover:bg-[#281745] text-[#c084fc] hover:text-[#faf5ff] border border-[#2e1c52] flex items-center justify-center cursor-pointer transition-all active:scale-95"
              title="Pitch adjustment"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>

            {isSettingsOpen && (
              <div className="absolute bottom-full mb-2 right-0 w-52 bg-[#1a1030] border border-[#3b2366] rounded-xl p-3 shadow-xl z-50">
                <div className="text-[10px] uppercase font-mono text-[#c084fc]/70 font-semibold mb-2">
                  Voice Pitch: {pitch}x
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.2"
                  step="0.1"
                  value={pitch}
                  onChange={(e) => onChangePitch(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-[#251543] rounded-lg appearance-none cursor-pointer accent-[#ec4899]"
                />
                <div className="flex justify-between text-[9px] font-mono text-[#c084fc]/60 mt-1">
                  <span>Deeper</span>
                  <span>Normal</span>
                  <span>Higher</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
