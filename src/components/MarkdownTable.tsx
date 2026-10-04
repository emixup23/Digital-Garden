import React, { useState } from 'react';
import {
  Table as TableIcon,
  Copy,
  Check,
  FileSpreadsheet,
  Plus,
  Trash2,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { ParsedTable, formatMarkdownTable, tableToCSV, ColumnAlignment } from '../utils/tableUtils';

interface MarkdownTableProps {
  parsed: ParsedTable;
  rawSyntax: string;
  renderInline: (text: string) => React.ReactNode;
  onUpdateSyntax?: (newSyntax: string) => void;
  interactive?: boolean;
}

export const MarkdownTable: React.FC<MarkdownTableProps> = ({
  parsed,
  rawSyntax,
  renderInline,
  onUpdateSyntax,
  interactive = true,
}) => {
  const [copiedType, setCopiedType] = useState<'md' | 'csv' | null>(null);
  const [isCompact, setIsCompact] = useState(false);

  const handleCopyMarkdown = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(rawSyntax);
      setCopiedType('md');
      setTimeout(() => setCopiedType(null), 1800);
    } catch {}
  };

  const handleCopyCSV = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const csv = tableToCSV(parsed.headers, parsed.rows);
      await navigator.clipboard.writeText(csv);
      setCopiedType('csv');
      setTimeout(() => setCopiedType(null), 1800);
    } catch {}
  };

  const handleAddRow = () => {
    if (!onUpdateSyntax) return;
    const newRow = Array.from({ length: parsed.headers.length }, () => '');
    const updatedRows = [...parsed.rows, newRow];
    const newSyntax = formatMarkdownTable({
      headers: parsed.headers,
      rows: updatedRows,
      alignments: parsed.alignments,
    });
    onUpdateSyntax(newSyntax);
  };

  const handleDeleteRow = (rowIndex: number) => {
    if (!onUpdateSyntax) return;
    if (parsed.rows.length <= 1) return;
    const updatedRows = parsed.rows.filter((_, idx) => idx !== rowIndex);
    const newSyntax = formatMarkdownTable({
      headers: parsed.headers,
      rows: updatedRows,
      alignments: parsed.alignments,
    });
    onUpdateSyntax(newSyntax);
  };

  const getAlignmentClass = (align: ColumnAlignment) => {
    switch (align) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      case 'left':
      default:
        return 'text-left';
    }
  };

  return (
    <div className="my-3 group/table border border-[#2e1c52] rounded-[8px] bg-[#120b1f] shadow-lg overflow-hidden transition-all duration-200 hover:border-[#ec4899]/40">
      {/* Table Top Utility Bar */}
      <div className="px-3 py-1.5 bg-[#1a1030] border-b border-[#2e1c52] flex items-center justify-between text-xs text-[#c084fc]/80 select-none">
        <div className="flex items-center gap-2">
          <TableIcon className="w-3.5 h-3.5 text-[#ec4899]" />
          <span className="font-['Space_Mono',monospace] text-[11px] font-medium text-[#faf5ff]">
            Table
          </span>
          <span className="text-[10px] font-['Space_Mono',monospace] text-[#c084fc]/60 px-1.5 py-0.5 rounded-[4px] bg-[#251543]">
            {parsed.headers.length} cols × {parsed.rows.length} rows
          </span>
        </div>

        <div className="flex items-center gap-1 opacity-70 group-hover/table:opacity-100 transition-opacity">
          {/* Toggle compact padding */}
          <button
            type="button"
            onClick={() => setIsCompact(!isCompact)}
            className="px-2 py-0.5 rounded-[4px] hover:bg-[#251543] text-[#c084fc] hover:text-[#faf5ff] transition-colors cursor-pointer text-[10px] flex items-center gap-1"
            title={isCompact ? 'Comfortable density' : 'Compact density'}
          >
            {isCompact ? <Maximize2 className="w-2.5 h-2.5" /> : <Minimize2 className="w-2.5 h-2.5" />}
            <span className="hidden sm:inline font-mono">{isCompact ? 'Comfortable' : 'Compact'}</span>
          </button>

          {/* Copy CSV */}
          <button
            type="button"
            onClick={handleCopyCSV}
            className="px-2 py-0.5 rounded-[4px] hover:bg-[#251543] text-[#c084fc] hover:text-[#faf5ff] transition-colors cursor-pointer text-[10px] flex items-center gap-1"
            title="Copy as CSV format"
          >
            {copiedType === 'csv' ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <FileSpreadsheet className="w-3 h-3" />
            )}
            <span className="font-mono">{copiedType === 'csv' ? 'Copied CSV' : 'CSV'}</span>
          </button>

          {/* Copy Markdown */}
          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="px-2 py-0.5 rounded-[4px] hover:bg-[#251543] text-[#c084fc] hover:text-[#faf5ff] transition-colors cursor-pointer text-[10px] flex items-center gap-1"
            title="Copy Markdown table syntax"
          >
            {copiedType === 'md' ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
            <span className="font-mono">{copiedType === 'md' ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Responsive Horizontal Scroll Container */}
      <div className="overflow-x-auto max-w-full scrollbar-thin scrollbar-thumb-[#3b2366] scrollbar-track-[#120b1f]">
        <table className="w-full border-collapse text-left text-sm text-[#faf5ff]">
          {/* Table Header */}
          <thead className="bg-[#180e2d] border-b-2 border-[#ec4899]/50 text-xs font-semibold text-[#faf5ff]">
            <tr>
              {parsed.headers.map((headerText, colIdx) => {
                const align = parsed.alignments[colIdx] || 'left';
                return (
                  <th
                    key={colIdx}
                    scope="col"
                    className={`${getAlignmentClass(align)} ${
                      isCompact ? 'px-3 py-2 text-xs' : 'px-4 py-2.5 text-xs'
                    } font-['Space_Grotesk',sans-serif] tracking-wide text-[#faf5ff] border-r border-[#2e1c52]/60 last:border-r-0 select-text`}
                  >
                    <div className="inline-block">{renderInline(headerText)}</div>
                  </th>
                );
              })}
              {interactive && onUpdateSyntax && (
                <th scope="col" className="w-8 px-2 py-2 text-center text-[#c084fc]/40" />
              )}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-[#2e1c52]/60">
            {parsed.rows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className="group/row transition-colors odd:bg-[#140d22] even:bg-[#180e2b] hover:bg-[#251543]/70"
              >
                {row.map((cellText, colIdx) => {
                  const align = parsed.alignments[colIdx] || 'left';
                  return (
                    <td
                      key={colIdx}
                      className={`${getAlignmentClass(align)} ${
                        isCompact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm'
                      } border-r border-[#2e1c52]/40 last:border-r-0 text-[#faf5ff] leading-relaxed align-top`}
                    >
                      {cellText.trim() ? (
                        renderInline(cellText)
                      ) : (
                        <span className="text-[#503577] text-xs italic font-mono select-none">—</span>
                      )}
                    </td>
                  );
                })}

                {/* Quick Row Deletion on Hover (when multiple rows exist) */}
                {interactive && onUpdateSyntax && (
                  <td className="w-8 px-1 py-1 text-center align-middle">
                    {parsed.rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(rowIdx)}
                        className="opacity-0 group-hover/row:opacity-100 p-1 rounded-[4px] text-[#c084fc]/60 hover:text-rose-400 hover:bg-rose-950/40 transition-all cursor-pointer"
                        title="Delete row"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Interactive Bottom Bar (Add row) */}
      {interactive && onUpdateSyntax && (
        <div className="px-3 py-1.5 bg-[#150d24] border-t border-[#2e1c52] flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={handleAddRow}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-['Space_Mono',monospace] text-[#faf5ff] bg-[#1f1338] hover:bg-[#281745] hover:text-[#ec4899] rounded-[6px] border border-[#2e1c52] hover:border-[#ec4899]/60 transition-all duration-150 cursor-pointer active:scale-95 shadow-2xs"
          >
            <Plus className="w-3 h-3 text-[#ec4899]" />
            <span>Add Row</span>
          </button>

          <span className="text-[11px] text-[#c084fc]/50 font-['Space_Mono',monospace]">
            Supports **bold**, *italic*, `code`, [[links]], #tags & @dates
          </span>
        </div>
      )}
    </div>
  );
};
