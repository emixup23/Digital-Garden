import React, { useState, useMemo } from 'react';
import { X, Boxes, Link as LinkIcon, Share2, Plus, Check, Search, FileText, StickyNote, Layers } from 'lucide-react';
import { CanvasBoard, CanvasNode } from '../types';
import {
  loadCanvasBoards,
  saveCanvasBoards,
  createNewCanvas,
  generateCanvasWikilink,
  generateCanvasMarkdownLink,
} from '../utils/canvasStore';

interface InsertCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (syntax: string) => void;
}

export const InsertCanvasModal: React.FC<InsertCanvasModalProps> = ({
  isOpen,
  onClose,
  onInsert,
}) => {
  const [boards, setBoards] = useState<CanvasBoard[]>(() => loadCanvasBoards());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBoardId, setSelectedBoardId] = useState<string>(() => {
    const list = loadCanvasBoards();
    return list.length > 0 ? list[0].id : '';
  });
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [format, setFormat] = useState<'wikilink' | 'markdown' | 'embed'>('wikilink');
  const [alias, setAlias] = useState('');
  const [newCanvasName, setNewCanvasName] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Filter boards by search
  const filteredBoards = useMemo(() => {
    if (!searchQuery.trim()) return boards;
    const q = searchQuery.toLowerCase();
    return boards.filter((b) => b.name.toLowerCase().includes(q));
  }, [boards, searchQuery]);

  const activeBoard = useMemo(() => {
    return boards.find((b) => b.id === selectedBoardId) || boards[0] || null;
  }, [boards, selectedBoardId]);

  if (!isOpen) return null;

  const handleCreateBoard = () => {
    if (!newCanvasName.trim()) return;
    const newBoard = createNewCanvas(newCanvasName.trim());
    const next = [...boards, newBoard];
    setBoards(next);
    saveCanvasBoards(next);
    setSelectedBoardId(newBoard.id);
    setSelectedCardId('');
    setNewCanvasName('');
    setIsCreatingNew(false);
  };

  const generatedSyntax = () => {
    if (!activeBoard) return '';
    if (format === 'embed') {
      return `![[canvas:${activeBoard.name}]]`;
    }
    if (format === 'markdown') {
      return generateCanvasMarkdownLink(alias.trim() || activeBoard.name, activeBoard.id, selectedCardId || undefined);
    }
    return generateCanvasWikilink(activeBoard.name, selectedCardId || undefined, alias.trim() || undefined);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const syntax = generatedSyntax();
    if (syntax) {
      onInsert(syntax);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-['Space_Grotesk',sans-serif]">
      <div className="w-full max-w-lg bg-[#150d24] border border-[#3b2366] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-[#faf5ff] animate-in fade-in-0 zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#2e1c52] bg-[#1a0f30]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#a855f7]/20 text-[#c084fc] border border-[#a855f7]/40">
              <Boxes className="w-4 h-4 text-[#c084fc]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#faf5ff]">Reference Canvas in Note</h2>
              <p className="text-[11px] text-[#c084fc]">
                Insert an interactive link or embedded preview to a visual whiteboard
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#251543] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Board Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono text-[#c084fc] uppercase tracking-wider">
                Select Canvas Board
              </label>
              <button
                type="button"
                onClick={() => setIsCreatingNew((prev) => !prev)}
                className="text-[11px] text-[#ec4899] hover:underline cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>{isCreatingNew ? 'Choose existing' : 'New canvas'}</span>
              </button>
            </div>

            {isCreatingNew ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newCanvasName}
                  onChange={(e) => setNewCanvasName(e.target.value)}
                  placeholder="e.g. System Architecture, Sprint Roadmap"
                  className="flex-1 px-3 py-2 rounded-lg bg-[#0c0714] border border-[#3b2366] text-white focus:outline-none focus:border-[#ec4899]"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleCreateBoard}
                  className="px-3 py-2 rounded-lg bg-[#ec4899] hover:bg-[#db2777] text-white font-medium cursor-pointer"
                >
                  Create & Select
                </button>
              </div>
            ) : (
              <div>
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-[#c084fc] absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search canvases..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#0c0714] border border-[#2e1c52] text-white focus:outline-none focus:border-[#a855f7]"
                  />
                </div>

                <div className="max-h-36 overflow-y-auto space-y-1 pr-1 border border-[#2e1c52] rounded-lg p-1.5 bg-[#0c0714]">
                  {filteredBoards.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setSelectedBoardId(b.id);
                        setSelectedCardId('');
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer text-left ${
                        b.id === activeBoard?.id
                          ? 'bg-[#a855f7]/25 text-[#faf5ff] font-semibold border border-[#a855f7]'
                          : 'hover:bg-[#1a0f30] text-[#c084fc]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Boxes className="w-3.5 h-3.5 text-[#a855f7] shrink-0" />
                        <span className="truncate">{b.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#c084fc]/70">
                        {b.nodes.length} cards
                      </span>
                    </button>
                  ))}
                  {filteredBoards.length === 0 && (
                    <div className="py-4 text-center text-[#c084fc]/60 text-xs">
                      No matching canvas boards found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Optional: Deep Link to Specific Card */}
          {activeBoard && activeBoard.nodes.length > 0 && !isCreatingNew && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-[#c084fc] uppercase tracking-wider flex items-center justify-between">
                <span>Direct Card Link (Optional)</span>
                {selectedCardId && (
                  <button
                    type="button"
                    onClick={() => setSelectedCardId('')}
                    className="text-[#ec4899] hover:underline cursor-pointer lowercase"
                  >
                    clear card anchor
                  </button>
                )}
              </label>
              <select
                value={selectedCardId}
                onChange={(e) => setSelectedCardId(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-[#0c0714] border border-[#2e1c52] text-white focus:outline-none focus:border-[#a855f7] cursor-pointer"
              >
                <option value="">Whole Canvas Board (Default)</option>
                {activeBoard.nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    Card: {n.title || n.type} ({n.id})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Format Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-[#c084fc] uppercase tracking-wider">
              Link Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormat('wikilink')}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer text-center ${
                  format === 'wikilink'
                    ? 'bg-[#ec4899]/20 border-[#ec4899] text-white font-semibold shadow-xs'
                    : 'bg-[#0c0714] border-[#2e1c52] text-[#c084fc] hover:bg-[#1a0f30]'
                }`}
              >
                <LinkIcon className="w-4 h-4 mb-1 text-[#ec4899]" />
                <span className="text-[11px]">Wiki-Link</span>
                <span className="text-[9px] font-mono text-[#c084fc]/70">[[canvas:...]]</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('markdown')}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer text-center ${
                  format === 'markdown'
                    ? 'bg-[#3b82f6]/20 border-[#3b82f6] text-white font-semibold shadow-xs'
                    : 'bg-[#0c0714] border-[#2e1c52] text-[#c084fc] hover:bg-[#1a0f30]'
                }`}
              >
                <Share2 className="w-4 h-4 mb-1 text-[#3b82f6]" />
                <span className="text-[11px]">Markdown Link</span>
                <span className="text-[9px] font-mono text-[#c084fc]/70">[...](canvas:..)</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('embed')}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer text-center ${
                  format === 'embed'
                    ? 'bg-[#a855f7]/20 border-[#a855f7] text-white font-semibold shadow-xs'
                    : 'bg-[#0c0714] border-[#2e1c52] text-[#c084fc] hover:bg-[#1a0f30]'
                }`}
              >
                <Boxes className="w-4 h-4 mb-1 text-[#a855f7]" />
                <span className="text-[11px]">Embedded Card</span>
                <span className="text-[9px] font-mono text-[#c084fc]/70">![[canvas:...]]</span>
              </button>
            </div>
          </div>

          {/* Optional Alias */}
          {format !== 'embed' && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-[#c084fc] uppercase tracking-wider">
                Display Text / Custom Alias (Optional)
              </label>
              <input
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder={activeBoard?.name || 'Custom link title'}
                className="w-full px-3 py-1.5 rounded-lg bg-[#0c0714] border border-[#2e1c52] text-white focus:outline-none focus:border-[#ec4899]"
              />
            </div>
          )}

          {/* Syntax Live Preview */}
          <div className="p-2.5 rounded-xl bg-[#0c0714] border border-[#2e1c52]">
            <div className="text-[10px] font-mono text-[#c084fc] uppercase mb-1">
              Generated Syntax Preview
            </div>
            <code className="text-[#ec4899] font-mono text-xs break-all block">
              {generatedSyntax() || 'No canvas selected'}
            </code>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2e1c52]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-[#c084fc] hover:text-white hover:bg-[#1f1338] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!activeBoard}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#ec4899] hover:bg-[#db2777] text-white shadow-md disabled:opacity-50 cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Insert Reference</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
