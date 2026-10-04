import React, { useState, useMemo } from 'react';
import {
  X,
  Table as TableIcon,
  Plus,
  Trash2,
  Check,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sparkles,
  Sliders,
  Copy,
  Eye,
  Rows,
  Columns as ColumnsIcon,
} from 'lucide-react';
import {
  ColumnAlignment,
  TABLE_PRESETS,
  TablePreset,
  formatMarkdownTable,
  createBlankTable,
} from '../utils/tableUtils';

interface InsertTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertTable: (markdownSyntax: string) => void;
  initialSelectionText?: string;
}

export const InsertTableModal: React.FC<InsertTableModalProps> = ({
  isOpen,
  onClose,
  onInsertTable,
  initialSelectionText,
}) => {
  // Mode: 'custom' or 'preset'
  const [activeTab, setActiveTab] = useState<'custom' | 'presets'>('custom');

  // Grid hover state
  const [hoverGrid, setHoverGrid] = useState<{ cols: number; rows: number } | null>(null);

  // Table Structure
  const [colsCount, setColsCount] = useState<number>(3);
  const [rowsCount, setRowsCount] = useState<number>(3);

  const [headers, setHeaders] = useState<string[]>(['Item / Service', 'Category', 'Status']);
  const [alignments, setAlignments] = useState<ColumnAlignment[]>(['left', 'left', 'center']);
  const [rows, setRows] = useState<string[][]>([
    ['Web Server', 'Frontend', '🟢 Active'],
    ['Database Node', 'Storage', '🟢 Active'],
    ['Cache Cluster', 'Memory', '🟡 Standby'],
  ]);

  const [copiedPreview, setCopiedPreview] = useState(false);

  // When opening or resetting
  React.useEffect(() => {
    if (isOpen) {
      setCopiedPreview(false);
      setHoverGrid(null);
    }
  }, [isOpen]);

  // Adjust table dimensions when colsCount or rowsCount changes manually
  const updateDimensions = (newCols: number, newRows: number) => {
    const safeCols = Math.max(1, Math.min(newCols, 10));
    const safeRows = Math.max(1, Math.min(newRows, 25));

    setColsCount(safeCols);
    setRowsCount(safeRows);

    setHeaders((prev) => {
      const next = [...prev];
      while (next.length < safeCols) {
        next.push(`Header ${next.length + 1}`);
      }
      return next.slice(0, safeCols);
    });

    setAlignments((prev) => {
      const next = [...prev];
      while (next.length < safeCols) {
        next.push('left');
      }
      return next.slice(0, safeCols);
    });

    setRows((prev) => {
      return Array.from({ length: safeRows }, (_, rIdx) => {
        const existingRow = prev[rIdx] || [];
        const nextRow = [...existingRow];
        while (nextRow.length < safeCols) {
          nextRow.push('');
        }
        return nextRow.slice(0, safeCols);
      });
    });
  };

  const handleApplyPreset = (preset: TablePreset) => {
    setColsCount(preset.headers.length);
    setRowsCount(preset.rows.length);
    setHeaders([...preset.headers]);
    setAlignments([...preset.alignments]);
    setRows(preset.rows.map((r) => [...r]));
    setActiveTab('custom');
  };

  const handleCellChange = (rowIdx: number, colIdx: number, val: string) => {
    setRows((prev) => {
      const copy = prev.map((r) => [...r]);
      if (copy[rowIdx]) {
        copy[rowIdx][colIdx] = val;
      }
      return copy;
    });
  };

  const handleHeaderChange = (colIdx: number, val: string) => {
    setHeaders((prev) => {
      const copy = [...prev];
      copy[colIdx] = val;
      return copy;
    });
  };

  const handleToggleAlignment = (colIdx: number) => {
    setAlignments((prev) => {
      const copy = [...prev];
      const current = copy[colIdx] || 'left';
      const order: ColumnAlignment[] = ['left', 'center', 'right'];
      const nextIndex = (order.indexOf(current) + 1) % order.length;
      copy[colIdx] = order[nextIndex];
      return copy;
    });
  };

  const handleSetGlobalAlignment = (align: ColumnAlignment) => {
    setAlignments(Array.from({ length: colsCount }, () => align));
  };

  const handleAddColumn = () => {
    updateDimensions(colsCount + 1, rowsCount);
  };

  const handleRemoveColumn = () => {
    if (colsCount > 1) {
      updateDimensions(colsCount - 1, rowsCount);
    }
  };

  const handleAddRow = () => {
    updateDimensions(colsCount, rowsCount + 1);
  };

  const handleRemoveRow = () => {
    if (rowsCount > 1) {
      updateDimensions(colsCount, rowsCount - 1);
    }
  };

  // Formatted markdown preview
  const generatedMarkdown = useMemo(() => {
    return formatMarkdownTable({
      headers,
      alignments,
      rows,
    });
  }, [headers, alignments, rows]);

  const handleInsert = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onInsertTable(generatedMarkdown);
    onClose();
  };

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(generatedMarkdown);
      setCopiedPreview(true);
      setTimeout(() => setCopiedPreview(false), 1800);
    } catch {}
  };

  if (!isOpen) return null;

  const currentDisplayCols = hoverGrid ? hoverGrid.cols : colsCount;
  const currentDisplayRows = hoverGrid ? hoverGrid.rows : rowsCount;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xs font-['Space_Grotesk',sans-serif]"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[92vh] bg-[#150d24] border border-[#2e1c52] rounded-[10px] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#2e1c52] flex items-center justify-between bg-[#1f1338] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-[8px] bg-[#2e1c52] text-[#ec4899] border border-[#ec4899]/30 shadow-inner">
              <TableIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#faf5ff] flex items-center gap-2">
                <span>Insert Markdown Table</span>
                <span className="text-[11px] font-mono text-[#c084fc] bg-[#251543] px-2 py-0.5 rounded-[4px] border border-[#3b2366]">
                  {colsCount} × {rowsCount}
                </span>
              </h2>
              <p className="text-[11px] text-[#c084fc]/70 font-['Space_Mono',monospace]">
                Create formatted GitHub Flavored Markdown (GFM) tables with rich styling
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tabs */}
            <div className="flex items-center bg-[#150d24] p-0.5 rounded-[6px] border border-[#2e1c52]">
              <button
                type="button"
                onClick={() => setActiveTab('custom')}
                className={`px-3 py-1 text-xs font-['Space_Mono',monospace] rounded-[4px] transition-colors cursor-pointer ${
                  activeTab === 'custom'
                    ? 'bg-[#ec4899] text-white font-medium shadow-xs'
                    : 'text-[#c084fc] hover:text-[#faf5ff]'
                }`}
              >
                Custom Grid
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('presets')}
                className={`px-3 py-1 text-xs font-['Space_Mono',monospace] rounded-[4px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'presets'
                    ? 'bg-[#ec4899] text-white font-medium shadow-xs'
                    : 'text-[#c084fc] hover:text-[#faf5ff]'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>Presets</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-[6px] text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#2e1c52] transition-colors cursor-pointer ml-1"
              title="Close modal (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {activeTab === 'presets' ? (
            /* Presets View */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#c084fc] font-['Space_Mono',monospace]">
                    Curated Table Templates
                  </h3>
                  <p className="text-xs text-[#c084fc]/60">
                    Select a ready-to-use template for DevOps, cloud inventory, task sprints, or API specs.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {TABLE_PRESETS.map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => handleApplyPreset(preset)}
                    className="p-3.5 rounded-[8px] bg-[#1a1030] border border-[#2e1c52] hover:border-[#ec4899] hover:bg-[#251543] transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-sm text-[#faf5ff] group-hover:text-white">
                          {preset.name}
                        </span>
                        <span className="text-[10px] font-mono text-[#c084fc] px-1.5 py-0.5 rounded-[4px] bg-[#150d24] border border-[#3b2366]">
                          {preset.headers.length} cols × {preset.rows.length} rows
                        </span>
                      </div>
                      <p className="text-xs text-[#c084fc]/70 mb-3 leading-relaxed">
                        {preset.description}
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-[#2e1c52]/60">
                      <div className="flex flex-wrap gap-1">
                        {preset.headers.map((h, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded-[3px] bg-[#120b1f] text-[#c084fc]"
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Custom Grid & Interactive Editor */
            <div className="space-y-5">
              {/* Top Controls: Matrix Picker + Dimension Spinners + Global Alignment */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-4 rounded-[8px] bg-[#1a1030] border border-[#2e1c52]">
                {/* 1. Visual Matrix Grid Picker */}
                <div className="md:col-span-5 flex flex-col items-center justify-center p-3 rounded-[6px] bg-[#150d24] border border-[#2e1c52]">
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#c084fc] font-['Space_Mono',monospace]">
                      Visual Dimension Picker
                    </span>
                    <span className="text-xs font-mono font-medium text-[#ec4899]">
                      {currentDisplayCols} × {currentDisplayRows}
                    </span>
                  </div>

                  {/* 8x8 Grid Squares */}
                  <div
                    className="grid grid-cols-8 gap-1 p-2 bg-[#120b1f] rounded-[6px] border border-[#2e1c52]/70 cursor-pointer select-none"
                    onMouseLeave={() => setHoverGrid(null)}
                  >
                    {Array.from({ length: 8 }, (_, rIdx) =>
                      Array.from({ length: 8 }, (_, cIdx) => {
                        const col = cIdx + 1;
                        const row = rIdx + 1;
                        const isHovered =
                          hoverGrid && col <= hoverGrid.cols && row <= hoverGrid.rows;
                        const isSelected =
                          !hoverGrid && col <= colsCount && row <= rowsCount;

                        return (
                          <div
                            key={`${rIdx}-${cIdx}`}
                            onMouseEnter={() => setHoverGrid({ cols: col, rows: row })}
                            onClick={() => {
                              updateDimensions(col, row);
                              setHoverGrid(null);
                            }}
                            className={`w-5 h-5 rounded-[3px] transition-all duration-100 ${
                              isHovered
                                ? 'bg-[#ec4899] scale-105 shadow-xs'
                                : isSelected
                                ? 'bg-[#a855f7]'
                                : 'bg-[#251543] hover:bg-[#3b2366]'
                            }`}
                            title={`${col} cols × ${row} rows`}
                          />
                        );
                      })
                    )}
                  </div>
                  <span className="text-[10px] text-[#c084fc]/50 mt-1.5 font-mono">
                    Hover to preview, click to set dimensions
                  </span>
                </div>

                {/* 2. Numeric Steppers & Alignment Helpers */}
                <div className="md:col-span-7 flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[#c084fc] mb-2 font-['Space_Mono',monospace]">
                      Table Dimensions
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Columns Stepper */}
                      <div className="p-2.5 rounded-[6px] bg-[#150d24] border border-[#2e1c52]">
                        <div className="flex items-center justify-between text-xs text-[#faf5ff] mb-1.5">
                          <span className="flex items-center gap-1.5 font-medium">
                            <ColumnsIcon className="w-3.5 h-3.5 text-[#ec4899]" />
                            Columns
                          </span>
                          <span className="font-mono text-sm font-bold text-[#faf5ff]">
                            {colsCount}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={handleRemoveColumn}
                            disabled={colsCount <= 1}
                            className="flex-1 py-1 text-xs font-bold rounded-[4px] bg-[#251543] hover:bg-[#3b2366] disabled:opacity-30 disabled:cursor-not-allowed text-[#faf5ff] transition-colors"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={handleAddColumn}
                            disabled={colsCount >= 10}
                            className="flex-1 py-1 text-xs font-bold rounded-[4px] bg-[#251543] hover:bg-[#3b2366] disabled:opacity-30 disabled:cursor-not-allowed text-[#faf5ff] transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Rows Stepper */}
                      <div className="p-2.5 rounded-[6px] bg-[#150d24] border border-[#2e1c52]">
                        <div className="flex items-center justify-between text-xs text-[#faf5ff] mb-1.5">
                          <span className="flex items-center gap-1.5 font-medium">
                            <Rows className="w-3.5 h-3.5 text-[#ec4899]" />
                            Rows
                          </span>
                          <span className="font-mono text-sm font-bold text-[#faf5ff]">
                            {rowsCount}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={handleRemoveRow}
                            disabled={rowsCount <= 1}
                            className="flex-1 py-1 text-xs font-bold rounded-[4px] bg-[#251543] hover:bg-[#3b2366] disabled:opacity-30 disabled:cursor-not-allowed text-[#faf5ff] transition-colors"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={handleAddRow}
                            disabled={rowsCount >= 25}
                            className="flex-1 py-1 text-xs font-bold rounded-[4px] bg-[#251543] hover:bg-[#3b2366] disabled:opacity-30 disabled:cursor-not-allowed text-[#faf5ff] transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Alignment Presets */}
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#c084fc] font-['Space_Mono',monospace] block mb-1.5">
                      Column Alignments
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSetGlobalAlignment('left')}
                        className="px-2.5 py-1 text-xs rounded-[4px] bg-[#150d24] hover:bg-[#251543] border border-[#2e1c52] text-[#faf5ff] flex items-center gap-1.5 cursor-pointer"
                        title="Align all columns to left"
                      >
                        <AlignLeft className="w-3.5 h-3.5 text-[#c084fc]" />
                        <span>All Left</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetGlobalAlignment('center')}
                        className="px-2.5 py-1 text-xs rounded-[4px] bg-[#150d24] hover:bg-[#251543] border border-[#2e1c52] text-[#faf5ff] flex items-center gap-1.5 cursor-pointer"
                        title="Align all columns to center"
                      >
                        <AlignCenter className="w-3.5 h-3.5 text-[#c084fc]" />
                        <span>All Center</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetGlobalAlignment('right')}
                        className="px-2.5 py-1 text-xs rounded-[4px] bg-[#150d24] hover:bg-[#251543] border border-[#2e1c52] text-[#faf5ff] flex items-center gap-1.5 cursor-pointer"
                        title="Align all columns to right"
                      >
                        <AlignRight className="w-3.5 h-3.5 text-[#c084fc]" />
                        <span>All Right</span>
                      </button>
                      <span className="text-[10px] text-[#c084fc]/50 font-mono ml-auto hidden sm:inline">
                        Click header alignment button to toggle
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Editable Table Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[#c084fc] font-['Space_Mono',monospace]">
                      Live Table Data Editor
                    </h4>
                    <span className="text-[10px] text-[#c084fc]/60 font-mono">
                      (Type directly to customize headers & cells before insert)
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleAddColumn}
                      disabled={colsCount >= 10}
                      className="px-2 py-0.5 text-[11px] font-mono rounded-[4px] bg-[#1a1030] hover:bg-[#251543] border border-[#2e1c52] text-[#faf5ff] flex items-center gap-1 cursor-pointer"
                      title="Add Column"
                    >
                      <Plus className="w-3 h-3 text-[#ec4899]" />
                      <span>Col</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAddRow}
                      disabled={rowsCount >= 25}
                      className="px-2 py-0.5 text-[11px] font-mono rounded-[4px] bg-[#1a1030] hover:bg-[#251543] border border-[#2e1c52] text-[#faf5ff] flex items-center gap-1 cursor-pointer"
                      title="Add Row"
                    >
                      <Plus className="w-3 h-3 text-[#ec4899]" />
                      <span>Row</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto max-w-full rounded-[8px] border border-[#2e1c52] bg-[#120b1f] shadow-inner">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#1f1338] border-b-2 border-[#ec4899]/50">
                        {headers.map((h, colIdx) => (
                          <th key={colIdx} className="p-2 border-r border-[#2e1c52] last:border-r-0">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={h}
                                onChange={(e) => handleHeaderChange(colIdx, e.target.value)}
                                placeholder={`Header ${colIdx + 1}`}
                                className="w-full px-2 py-1 text-xs font-semibold text-[#faf5ff] bg-[#150d24] border border-[#3b2366] focus:border-[#ec4899] rounded-[4px] focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleToggleAlignment(colIdx)}
                                className="p-1 rounded-[4px] bg-[#150d24] hover:bg-[#251543] text-[#c084fc] hover:text-[#faf5ff] border border-[#3b2366] cursor-pointer"
                                title={`Alignment: ${alignments[colIdx] || 'left'} (click to cycle)`}
                              >
                                {alignments[colIdx] === 'center' ? (
                                  <AlignCenter className="w-3 h-3 text-[#ec4899]" />
                                ) : alignments[colIdx] === 'right' ? (
                                  <AlignRight className="w-3 h-3 text-[#ec4899]" />
                                ) : (
                                  <AlignLeft className="w-3 h-3 text-[#ec4899]" />
                                )}
                              </button>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2e1c52]/60">
                      {rows.map((row, rIdx) => (
                        <tr key={rIdx} className="odd:bg-[#140d22] even:bg-[#180e2b]">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="p-1.5 border-r border-[#2e1c52]/40 last:border-r-0">
                              <input
                                type="text"
                                value={cell}
                                onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                                placeholder={`R${rIdx + 1} C${cIdx + 1}`}
                                className="w-full px-2 py-1 text-xs text-[#faf5ff] bg-[#150d24]/60 hover:bg-[#150d24] focus:bg-[#150d24] border border-transparent focus:border-[#ec4899]/70 rounded-[4px] focus:outline-none"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Raw Markdown Output Preview */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#c084fc] font-['Space_Mono',monospace]">
                    Generated Markdown Syntax
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyMarkdown}
                    className="text-[10px] font-mono text-[#c084fc] hover:text-[#faf5ff] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedPreview ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedPreview ? 'Copied' : 'Copy Markdown'}</span>
                  </button>
                </div>
                <pre className="p-3 rounded-[6px] bg-[#0d0717] border border-[#2e1c52] font-mono text-[11px] text-[#faf5ff] overflow-x-auto whitespace-pre leading-relaxed select-text">
                  {generatedMarkdown}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-[#2e1c52] bg-[#1f1338] flex items-center justify-between shrink-0">
          <div className="text-xs text-[#c084fc]/70 font-['Space_Mono',monospace]">
            Supports bold, italics, code, [[wiki-links]], #tags and @date badges
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#251543] rounded-[6px] transition-colors cursor-pointer border border-[#2e1c52]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleInsert()}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-[#ec4899] hover:bg-[#db2777] rounded-[6px] transition-all cursor-pointer shadow-md active:scale-95 flex items-center gap-1.5"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Insert Table</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
