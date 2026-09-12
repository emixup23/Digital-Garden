import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Search, ChevronUp, ChevronDown, X, Replace, ReplaceAll, ArrowRightLeft } from 'lucide-react';

interface InNoteFindReplaceProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  onContentChange: (newContent: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

interface MatchRange {
  start: number;
  end: number;
}

export const InNoteFindReplace: React.FC<InNoteFindReplaceProps> = ({
  isOpen,
  onClose,
  content,
  onContentChange,
  textareaRef,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  const [isCaseSensitive, setIsCaseSensitive] = useState(false);
  const [isWholeWord, setIsWholeWord] = useState(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  const findInputRef = useRef<HTMLInputElement | null>(null);

  // Focus find input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        findInputRef.current?.focus();
        findInputRef.current?.select();
      }, 50);
    }
  }, [isOpen]);

  // Compute all matches in content
  const matches: MatchRange[] = useMemo(() => {
    if (!searchTerm) return [];

    let regexPattern = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (isWholeWord) {
      regexPattern = `\\b${regexPattern}\\b`;
    }

    const flags = isCaseSensitive ? 'g' : 'gi';
    let regex: RegExp;
    try {
      regex = new RegExp(regexPattern, flags);
    } catch {
      return [];
    }

    const list: MatchRange[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
      list.push({
        start: match.index,
        end: match.index + match[0].length,
      });
    }

    return list;
  }, [content, searchTerm, isCaseSensitive, isWholeWord]);

  // Keep index within bounds
  useEffect(() => {
    if (matches.length === 0) {
      setCurrentMatchIndex(0);
    } else if (currentMatchIndex >= matches.length) {
      setCurrentMatchIndex(0);
    }
  }, [matches.length, currentMatchIndex]);

  // Scroll and select current match in the textarea
  const selectMatch = useCallback(
    (idx: number) => {
      const textarea = textareaRef.current;
      if (!textarea || matches.length === 0) return;
      const targetMatch = matches[idx];
      if (!targetMatch) return;

      textarea.focus();
      textarea.setSelectionRange(targetMatch.start, targetMatch.end);

      // Compute approximate scroll position
      const textBefore = content.substring(0, targetMatch.start);
      const linesBefore = textBefore.split('\n').length;
      const totalLines = content.split('\n').length || 1;
      const scrollRatio = linesBefore / totalLines;
      const targetScroll = scrollRatio * textarea.scrollHeight - textarea.clientHeight / 2;
      textarea.scrollTop = Math.max(0, targetScroll);
    },
    [matches, content, textareaRef]
  );

  const handleNext = () => {
    if (matches.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % matches.length;
    setCurrentMatchIndex(nextIdx);
    selectMatch(nextIdx);
  };

  const handlePrev = () => {
    if (matches.length === 0) return;
    const prevIdx = (currentMatchIndex - 1 + matches.length) % matches.length;
    setCurrentMatchIndex(prevIdx);
    selectMatch(prevIdx);
  };

  const handleReplaceOne = () => {
    if (matches.length === 0) return;
    const match = matches[currentMatchIndex];
    if (!match) return;

    const newContent =
      content.substring(0, match.start) + replaceTerm + content.substring(match.end);
    onContentChange(newContent);

    setTimeout(() => {
      // Stay on current or next match
      selectMatch(currentMatchIndex % Math.max(1, matches.length - 1));
    }, 20);
  };

  const handleReplaceAll = () => {
    if (matches.length === 0) return;

    let regexPattern = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (isWholeWord) {
      regexPattern = `\\b${regexPattern}\\b`;
    }
    const flags = isCaseSensitive ? 'g' : 'gi';
    const regex = new RegExp(regexPattern, flags);

    const newContent = content.replace(regex, replaceTerm);
    onContentChange(newContent);
    setCurrentMatchIndex(0);
  };

  const handleFindKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        handlePrev();
      } else {
        handleNext();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      textareaRef.current?.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="in-note-find-replace-bar"
      className="bg-[#150d24] border-b border-[#2e1c52] px-4 py-2 flex flex-col gap-2 shadow-lg z-30 select-none animate-in fade-in duration-150"
    >
      {/* Search Row */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 bg-[#1f1338] border border-[#2e1c52] focus-within:border-[#ec4899] rounded-[6px] px-2 py-1 text-xs text-[#faf5ff] flex-1 min-w-[200px] max-w-md">
          <Search className="w-3.5 h-3.5 text-[#c084fc] shrink-0" />
          <input
            ref={findInputRef}
            type="text"
            placeholder="Find in active note... (Enter / Shift+Enter)"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentMatchIndex(0);
            }}
            onKeyDown={handleFindKeyDown}
            className="bg-transparent text-xs text-[#faf5ff] placeholder-[#c084fc]/50 focus:outline-none flex-1 font-['Space_Mono',monospace]"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="text-[#c084fc] hover:text-[#faf5ff] cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Matches counter */}
        <span className="text-[11px] font-['Space_Mono',monospace] text-[#c084fc] px-1.5 min-w-[65px]">
          {searchTerm
            ? matches.length > 0
              ? `${currentMatchIndex + 1} / ${matches.length}`
              : '0 matches'
            : ''}
        </span>

        {/* Prev / Next buttons */}
        <div className="flex items-center bg-[#1f1338] border border-[#2e1c52] rounded-[6px] p-0.5">
          <button
            type="button"
            onClick={handlePrev}
            disabled={matches.length === 0}
            className={`p-1 rounded-[4px] transition-colors cursor-pointer ${
              matches.length === 0
                ? 'text-[#503577] cursor-not-allowed'
                : 'text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#281745]'
            }`}
            title="Previous match (Shift+Enter)"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={matches.length === 0}
            className={`p-1 rounded-[4px] transition-colors cursor-pointer ${
              matches.length === 0
                ? 'text-[#503577] cursor-not-allowed'
                : 'text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#281745]'
            }`}
            title="Next match (Enter)"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Match options: Case Sensitive & Whole Word */}
        <div className="flex items-center bg-[#1f1338] border border-[#2e1c52] rounded-[6px] p-0.5">
          <button
            type="button"
            onClick={() => setIsCaseSensitive(!isCaseSensitive)}
            className={`px-1.5 py-1 text-[10px] font-mono font-bold rounded-[4px] transition-colors cursor-pointer ${
              isCaseSensitive
                ? 'bg-[#ec4899] text-white'
                : 'text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#281745]'
            }`}
            title="Match Case (Case sensitive)"
          >
            Aa
          </button>
          <button
            type="button"
            onClick={() => setIsWholeWord(!isWholeWord)}
            className={`px-1.5 py-1 text-[10px] font-mono font-bold rounded-[4px] transition-colors cursor-pointer ${
              isWholeWord
                ? 'bg-[#ec4899] text-white'
                : 'text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#281745]'
            }`}
            title="Match Whole Word"
          >
            \b
          </button>
        </div>

        {/* Toggle Replace Row */}
        <button
          type="button"
          onClick={() => setShowReplace(!showReplace)}
          className={`px-2 py-1 rounded-[6px] text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer border ${
            showReplace
              ? 'bg-[#ec4899]/20 text-[#ec4899] border-[#ec4899]/50'
              : 'bg-[#1f1338] text-[#c084fc] border-[#2e1c52] hover:text-[#faf5ff] hover:bg-[#281745]'
          }`}
          title="Toggle Replace mode (Ctrl+H / Cmd+H)"
        >
          <ArrowRightLeft className="w-3 h-3" />
          <span className="hidden sm:inline text-[11px]">Replace</span>
        </button>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="ml-auto text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#1f1338] p-1 rounded-[4px] cursor-pointer"
          title="Close find bar (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Replace Row */}
      {showReplace && (
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-[#2e1c52]/60">
          <div className="flex items-center gap-1.5 bg-[#1f1338] border border-[#2e1c52] focus-within:border-[#ec4899] rounded-[6px] px-2 py-1 text-xs text-[#faf5ff] flex-1 min-w-[200px] max-w-md">
            <Replace className="w-3.5 h-3.5 text-[#c084fc] shrink-0" />
            <input
              type="text"
              placeholder="Replace with..."
              value={replaceTerm}
              onChange={(e) => setReplaceTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleReplaceOne();
                }
              }}
              className="bg-transparent text-xs text-[#faf5ff] placeholder-[#c084fc]/50 focus:outline-none flex-1 font-['Space_Mono',monospace]"
            />
            {replaceTerm && (
              <button
                type="button"
                onClick={() => setReplaceTerm('')}
                className="text-[#c084fc] hover:text-[#faf5ff] cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleReplaceOne}
            disabled={matches.length === 0}
            className={`px-2.5 py-1 text-xs rounded-[6px] font-medium transition-all duration-150 cursor-pointer border ${
              matches.length === 0
                ? 'bg-[#1f1338] text-[#503577] border-[#2e1c52] cursor-not-allowed'
                : 'bg-[#1f1338] hover:bg-[#281745] text-[#faf5ff] border-[#2e1c52] hover:border-[#ec4899]/60 active:scale-95'
            }`}
            title="Replace current match"
          >
            Replace
          </button>

          <button
            type="button"
            onClick={handleReplaceAll}
            disabled={matches.length === 0}
            className={`px-2.5 py-1 text-xs rounded-[6px] font-medium transition-all duration-150 cursor-pointer border ${
              matches.length === 0
                ? 'bg-[#1f1338] text-[#503577] border-[#2e1c52] cursor-not-allowed'
                : 'bg-[#ec4899] hover:bg-[#db2777] text-white border-[#ec4899] shadow-xs active:scale-95'
            }`}
            title="Replace all occurrences"
          >
            Replace All
          </button>
        </div>
      )}
    </div>
  );
};
