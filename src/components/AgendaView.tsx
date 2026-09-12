import React, { useState, useMemo } from 'react';
import {
  Calendar,
  CalendarDays,
  Clock,
  CheckCircle2,
  Circle,
  Plus,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  FileText,
  AlertCircle,
  Users,
  Bell,
  Tag,
  Sparkles,
  Trash2,
  Edit2,
  X,
  ExternalLink,
  ArrowRight,
  CheckSquare,
  ListTodo,
  CalendarRange,
  Flame,
} from 'lucide-react';
import { NoteFile, Folder, ThemeConfig } from '../types';
import {
  AgendaItem,
  AgendaItemType,
  AgendaPriority,
  formatDateKey,
  formatDisplayDate,
  loadManualAgendaItems,
  saveManualAgendaItems,
  extractTasksFromNotes,
  toggleTaskInNoteContent,
  generateDailyNoteTemplate,
} from '../utils/agenda';
import { createNewNote } from '../utils/storage';
import { formatMfContent } from '../utils/parser';

interface AgendaViewProps {
  notes: NoteFile[];
  folders: Folder[];
  onUpdateNote: (note: NoteFile) => void;
  onNavigateToNote: (titleOrId: string) => void;
  onCreateNote: (folderId: string | null) => void;
  onSelectNote: (noteId: string) => void;
  theme?: ThemeConfig;
}

type AgendaDisplayMode = 'agenda' | 'day' | 'week' | 'matrix';

export const AgendaView: React.FC<AgendaViewProps> = ({
  notes,
  folders,
  onUpdateNote,
  onNavigateToNote,
  onCreateNote,
  onSelectNote,
  theme,
}) => {
  const todayKey = useMemo(() => formatDateKey(new Date()), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayKey);
  const [displayMode, setDisplayMode] = useState<AgendaDisplayMode>('agenda');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Manual items stored in localStorage
  const [manualItems, setManualItems] = useState<AgendaItem[]>(() => loadManualAgendaItems());

  // Modal for new item
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(todayKey);
  const [newTime, setNewTime] = useState('10:00');
  const [newEndTime, setNewEndTime] = useState('11:00');
  const [newIsAllDay, setNewIsAllDay] = useState(false);
  const [newType, setNewType] = useState<AgendaItemType>('task');
  const [newPriority, setNewPriority] = useState<AgendaPriority>('medium');
  const [newNoteLink, setNewNoteLink] = useState<string>('');
  const [newDescription, setNewDescription] = useState('');
  const [newSyncToDailyNote, setNewSyncToDailyNote] = useState(false);

  // Extract tasks dynamically from notes in real-time
  const noteTasks = useMemo(() => {
    return extractTasksFromNotes(notes);
  }, [notes]);

  // Combine manual agenda items + note tasks
  const allItems = useMemo(() => {
    return [...manualItems, ...noteTasks];
  }, [manualItems, noteTasks]);

  // Handle toggling an item's completion
  const handleToggleItem = (item: AgendaItem) => {
    const nextCompleted = !item.completed;

    if (item.sourceType === 'note-task' && item.noteId && typeof item.lineNumber === 'number') {
      const note = notes.find((n) => n.id === item.noteId);
      if (note) {
        const updatedContent = toggleTaskInNoteContent(note.content, item.lineNumber, nextCompleted);
        onUpdateNote({
          ...note,
          content: updatedContent,
          updatedAt: Date.now(),
        });
      }
    } else {
      // Manual item toggle
      const updated = manualItems.map((mi) =>
        mi.id === item.id ? { ...mi, completed: nextCompleted } : mi
      );
      setManualItems(updated);
      saveManualAgendaItems(updated);
    }
  };

  // Handle deleting a manual item
  const handleDeleteManualItem = (id: string) => {
    const updated = manualItems.filter((mi) => mi.id !== id);
    setManualItems(updated);
    saveManualAgendaItems(updated);
  };

  // Handle adding a new manual item
  const handleCreateNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newItem: AgendaItem = {
      id: `agenda-manual-${Date.now()}`,
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      date: newDate || selectedDate,
      time: newIsAllDay ? undefined : newTime || undefined,
      endTime: newIsAllDay ? undefined : newEndTime || undefined,
      allDay: newIsAllDay,
      completed: false,
      type: newType,
      priority: newPriority,
      noteId: newNoteLink || undefined,
      noteTitle: newNoteLink ? notes.find((n) => n.id === newNoteLink)?.title : undefined,
      sourceType: 'manual',
      createdAt: Date.now(),
    };

    const updated = [newItem, ...manualItems];
    setManualItems(updated);
    saveManualAgendaItems(updated);

    // If user requested to sync to today's daily note
    if (newSyncToDailyNote) {
      handleAppendToDailyNote(newItem);
    }

    // Reset form
    setNewTitle('');
    setNewDescription('');
    setNewIsAllDay(false);
    setIsNewItemModalOpen(false);
  };

  // Append an item directly as a task to the Daily Note
  const handleAppendToDailyNote = (item: AgendaItem) => {
    const dateStr = item.date || selectedDate;
    const existing = notes.find(
      (n) =>
        n.title === dateStr ||
        n.name === `${dateStr}.md` ||
        n.title === `Daily ${dateStr}`
    );

    const timePrefix = item.time ? `${item.time} ` : '';
    const taskLine = `- [ ] ${timePrefix}${item.title} #${item.type}`;

    if (existing) {
      const updatedContent = `${existing.content.trimEnd()}\n${taskLine}\n`;
      onUpdateNote({
        ...existing,
        content: updatedContent,
        updatedAt: Date.now(),
      });
    } else {
      const newNote = createNewNote(
        dateStr,
        null,
        ['daily', 'agenda']
      );
      const template = generateDailyNoteTemplate(dateStr);
      newNote.content = formatMfContent(
        dateStr,
        ['daily', 'agenda'],
        `${template}\n${taskLine}\n`
      );
      onUpdateNote(newNote);
    }
  };

  // Open or create a Daily Note for a specific date
  const handleOpenOrCreateDailyNote = (dateStr: string) => {
    const existing = notes.find(
      (n) =>
        n.title === dateStr ||
        n.name === `${dateStr}.md` ||
        n.name === `${dateStr}.mf` ||
        n.title.toLowerCase() === `daily ${dateStr.toLowerCase()}` ||
        n.title.toLowerCase() === `daily note — ${dateStr.toLowerCase()}`
    );

    if (existing) {
      onSelectNote(existing.id);
    } else {
      // Create new daily note with rich template
      const dailyFolder = folders.find((f) => f.name.toLowerCase() === 'daily') || null;
      const newNote = createNewNote(dateStr, dailyFolder?.id || null, ['daily', 'agenda']);
      const body = generateDailyNoteTemplate(dateStr);
      newNote.content = formatMfContent(dateStr, ['daily', 'agenda'], body);
      onUpdateNote(newNote);
      onSelectNote(newNote.id);
    }
  };

  // Date Navigation
  const handlePrevDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() - 1);
    setSelectedDate(formatDateKey(date));
  };

  const handleNextDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + 1);
    setSelectedDate(formatDateKey(date));
  };

  const handleGoToday = () => {
    setSelectedDate(todayKey);
  };

  // Calculate week dates (Monday - Sunday) around selected date
  const weekDays = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const curr = new Date(y, m - 1, d);
    // Find monday
    const day = curr.getDay();
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(curr.setDate(diff));

    const days = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + i);
      days.push({
        dateKey: formatDateKey(dayDate),
        dayName: dayDate.toLocaleDateString(undefined, { weekday: 'short' }),
        dayNum: dayDate.getDate(),
        isToday: formatDateKey(dayDate) === todayKey,
        isSelected: formatDateKey(dayDate) === selectedDate,
      });
    }
    return days;
  }, [selectedDate, todayKey]);

  // Filtered items for currently selected date (or all if in matrix mode)
  const displayedItems = useMemo(() => {
    return allItems
      .filter((item) => {
        // Date match (if not matrix view)
        if (displayMode !== 'matrix' && displayMode !== 'week') {
          if (item.date !== selectedDate) return false;
        }

        // Status filter
        if (statusFilter === 'pending' && item.completed) return false;
        if (statusFilter === 'completed' && !item.completed) return false;

        // Type filter
        if (typeFilter !== 'all' && item.type !== typeFilter) return false;

        // Priority filter
        if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchNote = item.noteTitle?.toLowerCase().includes(q);
          const matchDesc = item.description?.toLowerCase().includes(q);
          const matchTag = item.tags?.some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchNote && !matchDesc && !matchTag) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Sort: pending first, then by time or created
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
        if (a.time && b.time) {
          return a.time.localeCompare(b.time);
        }
        if (a.time) return -1;
        if (b.time) return 1;
        return b.createdAt - a.createdAt;
      });
  }, [allItems, selectedDate, displayMode, statusFilter, typeFilter, priorityFilter, searchQuery]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const todayItems = allItems.filter((i) => i.date === selectedDate);
    const total = todayItems.length;
    const completed = todayItems.filter((i) => i.completed).length;
    const pending = total - completed;
    const meetings = todayItems.filter((i) => i.type === 'meeting').length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    const overdueCount = allItems.filter(
      (i) => !i.completed && i.date < todayKey
    ).length;

    return { total, completed, pending, meetings, percent, overdueCount };
  }, [allItems, selectedDate, todayKey]);

  // Relative day label
  const relativeDateLabel = useMemo(() => {
    if (selectedDate === todayKey) return 'Today';
    const [y, m, d] = selectedDate.split('-').map(Number);
    const cur = new Date(y, m - 1, d);
    const [ty, tm, td] = todayKey.split('-').map(Number);
    const tod = new Date(ty, tm - 1, td);
    const diffDays = Math.round((cur.getTime() - tod.getTime()) / (1000 * 3600 * 24));
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
    if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;
    return '';
  }, [selectedDate, todayKey]);

  // Helper for Type colors & badges
  const getTypeBadge = (type: AgendaItemType) => {
    switch (type) {
      case 'meeting':
        return {
          icon: Users,
          bg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
          dot: '#818cf8',
          label: 'Meeting',
        };
      case 'deadline':
        return {
          icon: AlertCircle,
          bg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
          dot: '#f43f5e',
          label: 'Deadline',
        };
      case 'event':
        return {
          icon: CalendarRange,
          bg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
          dot: '#06b6d4',
          label: 'Event',
        };
      case 'reminder':
        return {
          icon: Bell,
          bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          dot: '#f59e0b',
          label: 'Reminder',
        };
      case 'task':
      default:
        return {
          icon: CheckSquare,
          bg: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
          dot: '#ec4899',
          label: 'Task',
        };
    }
  };

  const getPriorityBadge = (priority: AgendaPriority) => {
    switch (priority) {
      case 'high':
        return { label: 'High', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' };
      case 'medium':
        return { label: 'Med', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' };
      case 'low':
      default:
        return { label: 'Low', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' };
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0c0714] text-[#faf5ff] font-['Space_Grotesk',sans-serif]">
      {/* Top Agenda Header & Action Bar */}
      <header className="px-6 py-3.5 bg-[#150d24] border-b border-[#2e1c52] flex items-center justify-between gap-4 flex-wrap shrink-0">
        {/* Date Navigator */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-[8px] bg-[#ec4899]/15 text-[#ec4899] border border-[#ec4899]/30">
            <CalendarDays className="w-5 h-5 text-[#ec4899]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#faf5ff] tracking-tight flex items-center gap-2">
                <span>{formatDisplayDate(selectedDate)}</span>
                {relativeDateLabel && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#ec4899]/20 text-[#ec4899] border border-[#ec4899]/40 font-medium">
                    {relativeDateLabel}
                  </span>
                )}
              </h2>
            </div>
            <p className="text-xs text-[#c084fc]/70 font-mono flex items-center gap-2">
              <span>Agenda & Schedule</span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold">{metrics.completed}/{metrics.total} Done</span>
              {metrics.overdueCount > 0 && (
                <>
                  <span>•</span>
                  <span className="text-rose-400 font-semibold flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    {metrics.overdueCount} Overdue
                  </span>
                </>
              )}
            </p>
          </div>

          {/* Prev / Today / Next Controls */}
          <div className="flex items-center gap-1 ml-3 bg-[#1f1338] p-1 rounded-[8px] border border-[#2e1c52]">
            <button
              id="btn-agenda-prev-day"
              type="button"
              onClick={handlePrevDay}
              className="p-1 rounded-[4px] hover:bg-[#281745] text-[#c084fc] hover:text-[#faf5ff] transition-all duration-150 cursor-pointer active:scale-95"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              id="btn-agenda-today"
              type="button"
              onClick={handleGoToday}
              className={`px-2 py-0.5 text-xs font-mono rounded-[4px] transition-all duration-150 cursor-pointer active:scale-95 ${
                selectedDate === todayKey
                  ? 'bg-[#ec4899] hover:bg-[#db2777] text-[#faf5ff] font-semibold shadow-xs'
                  : 'text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#281745]'
              }`}
            >
              Today
            </button>

            <button
              id="btn-agenda-next-day"
              type="button"
              onClick={handleNextDay}
              className="p-1 rounded-[4px] hover:bg-[#281745] text-[#c084fc] hover:text-[#faf5ff] transition-all duration-150 cursor-pointer active:scale-95"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-[#1f1338] p-0.5 rounded-[6px] border border-[#2e1c52] text-xs">
            <button
              id="btn-agenda-mode-timeline"
              type="button"
              onClick={() => setDisplayMode('agenda')}
              className={`px-2.5 py-1 rounded-[4px] transition-all duration-150 cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                displayMode === 'agenda'
                  ? 'bg-[#ec4899] hover:bg-[#db2777] text-[#faf5ff] font-semibold shadow-xs hover:shadow-[0_0_8px_rgba(236,72,153,0.35)]'
                  : 'text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#281745]'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5" />
              <span>Agenda</span>
            </button>

            <button
              id="btn-agenda-mode-day"
              type="button"
              onClick={() => setDisplayMode('day')}
              className={`px-2.5 py-1 rounded-[4px] transition-all duration-150 cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                displayMode === 'day'
                  ? 'bg-[#ec4899] hover:bg-[#db2777] text-[#faf5ff] font-semibold shadow-xs hover:shadow-[0_0_8px_rgba(236,72,153,0.35)]'
                  : 'text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#281745]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Schedule</span>
            </button>

            <button
              id="btn-agenda-mode-week"
              type="button"
              onClick={() => setDisplayMode('week')}
              className={`px-2.5 py-1 rounded-[4px] transition-all duration-150 cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                displayMode === 'week'
                  ? 'bg-[#ec4899] hover:bg-[#db2777] text-[#faf5ff] font-semibold shadow-xs hover:shadow-[0_0_8px_rgba(236,72,153,0.35)]'
                  : 'text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#281745]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Week</span>
            </button>

            <button
              id="btn-agenda-mode-matrix"
              type="button"
              onClick={() => setDisplayMode('matrix')}
              className={`px-2.5 py-1 rounded-[4px] transition-all duration-150 cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                displayMode === 'matrix'
                  ? 'bg-[#ec4899] hover:bg-[#db2777] text-[#faf5ff] font-semibold shadow-xs hover:shadow-[0_0_8px_rgba(236,72,153,0.35)]'
                  : 'text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#281745]'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>All Tasks</span>
            </button>
          </div>

          {/* Open/Create Daily Note Button */}
          <button
            id="btn-agenda-open-daily-note"
            type="button"
            onClick={() => handleOpenOrCreateDailyNote(selectedDate)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#1f1338] hover:bg-[#281745] border border-[#2e1c52] hover:border-[#ec4899]/60 text-[#faf5ff] text-xs font-medium transition-all duration-150 cursor-pointer active:scale-95 shadow-2xs"
            title={`Open or create daily note for ${selectedDate}`}
          >
            <FileText className="w-3.5 h-3.5 text-[#ec4899]" />
            <span>Daily Note</span>
          </button>

          {/* Add Agenda Item Button */}
          <button
            id="btn-agenda-add-item"
            type="button"
            onClick={() => {
              setNewDate(selectedDate);
              setIsNewItemModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-[6px] bg-[#ec4899] hover:bg-[#db2777] hover:shadow-[0_0_12px_rgba(236,72,153,0.35)] text-[#faf5ff] text-xs font-semibold shadow-xs transition-all duration-150 cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-[#faf5ff]" />
            <span>New Item</span>
          </button>
        </div>
      </header>

      {/* Week Day Strips (shown in Week view or for quick day switching) */}
      <div className="px-6 py-2 bg-[#10091d] border-b border-[#2e1c52] flex items-center justify-between gap-1 overflow-x-auto">
        <div className="flex items-center gap-2 w-full justify-between">
          {weekDays.map((wd) => {
            const countForDay = allItems.filter((i) => i.date === wd.dateKey).length;
            const completedForDay = allItems.filter((i) => i.date === wd.dateKey && i.completed).length;

            return (
              <button
                key={wd.dateKey}
                type="button"
                onClick={() => setSelectedDate(wd.dateKey)}
                className={`flex-1 min-w-[70px] max-w-[140px] py-1.5 px-2 rounded-[8px] flex flex-col items-center transition-all cursor-pointer border ${
                  wd.isSelected
                    ? 'bg-[#ec4899]/20 border-[#ec4899] text-[#faf5ff] shadow-sm'
                    : 'bg-[#150d24] border-[#2e1c52] text-[#c084fc] hover:bg-[#1f1338] hover:text-[#faf5ff]'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono uppercase text-[#c084fc]/70">{wd.dayName}</span>
                  {wd.isToday && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ec4899]" />
                  )}
                </div>
                <span className={`text-sm font-bold ${wd.isSelected ? 'text-[#faf5ff]' : ''}`}>
                  {wd.dayNum}
                </span>
                <div className="flex items-center gap-1 mt-0.5 text-[9px] font-mono">
                  {countForDay > 0 ? (
                    <span className={completedForDay === countForDay ? 'text-emerald-400' : 'text-[#c084fc]'}>
                      {completedForDay}/{countForDay}
                    </span>
                  ) : (
                    <span className="text-[#c084fc]/40">-</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="px-6 py-2 bg-[#150d24] border-b border-[#2e1c52] flex items-center justify-between gap-3 flex-wrap text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="w-3.5 h-3.5 text-[#c084fc] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Filter agenda tasks & meetings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-1 text-xs rounded-[6px] bg-[#1f1338] border border-[#2e1c52] text-[#faf5ff] placeholder-[#c084fc]/50 focus:outline-none focus:border-[#ec4899]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#c084fc] hover:text-[#faf5ff]"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status filter */}
          <div className="flex items-center bg-[#1f1338] p-0.5 rounded-[6px] border border-[#2e1c52] text-[11px]">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2 py-0.5 rounded-[4px] cursor-pointer ${
                statusFilter === 'all' ? 'bg-[#ec4899] text-white font-medium' : 'text-[#c084fc] hover:text-white'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-2 py-0.5 rounded-[4px] cursor-pointer ${
                statusFilter === 'pending' ? 'bg-[#ec4899] text-white font-medium' : 'text-[#c084fc] hover:text-white'
              }`}
            >
              Pending
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('completed')}
              className={`px-2 py-0.5 rounded-[4px] cursor-pointer ${
                statusFilter === 'completed' ? 'bg-[#ec4899] text-white font-medium' : 'text-[#c084fc] hover:text-white'
              }`}
            >
              Done
            </button>
          </div>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2 py-1 text-xs rounded-[6px] bg-[#1f1338] border border-[#2e1c52] text-[#faf5ff] focus:outline-none focus:border-[#ec4899] cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="task">Tasks</option>
            <option value="meeting">Meetings</option>
            <option value="deadline">Deadlines</option>
            <option value="event">Events</option>
            <option value="reminder">Reminders</option>
          </select>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2 py-1 text-xs rounded-[6px] bg-[#1f1338] border border-[#2e1c52] text-[#faf5ff] focus:outline-none focus:border-[#ec4899] cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left/Center: Items List / Day Timeline / Week View */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* View 1: Agenda / Timeline List View */}
          {displayMode === 'agenda' && (
            <div className="max-w-4xl mx-auto space-y-3">
              {displayedItems.length === 0 ? (
                <div className="p-12 text-center text-[#c084fc] space-y-3 border border-dashed border-[#2e1c52] rounded-xl bg-[#150d24]/50">
                  <Calendar className="w-12 h-12 stroke-1 opacity-40 mx-auto text-[#c084fc]" />
                  <div className="space-y-1">
                    <h4 className="text-base font-semibold text-[#faf5ff]">
                      No Agenda Items for {selectedDate === todayKey ? 'Today' : selectedDate}
                    </h4>
                    <p className="text-xs max-w-md mx-auto text-[#c084fc]/70">
                      Add a scheduled meeting or checklist item directly, or create checklist tasks in any note with <code className="bg-[#1f1338] px-1.5 py-0.5 rounded text-[#ec4899]">- [ ] Task due: {selectedDate}</code>.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setNewDate(selectedDate);
                        setIsNewItemModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-[6px] bg-[#ec4899] text-white text-xs font-semibold hover:bg-[#db2777] cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 inline mr-1" />
                      Add Agenda Item
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenOrCreateDailyNote(selectedDate)}
                      className="px-3 py-1.5 rounded-[6px] bg-[#1f1338] border border-[#2e1c52] text-[#faf5ff] text-xs font-medium hover:bg-[#2e1c52] cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 inline mr-1 text-[#ec4899]" />
                      Open Daily Note
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {displayedItems.map((item) => {
                    const badge = getTypeBadge(item.type);
                    const prio = getPriorityBadge(item.priority);
                    const TypeIcon = badge.icon;

                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 group ${
                          item.completed
                            ? 'bg-[#150d24]/40 border-[#2e1c52]/60 opacity-60'
                            : 'bg-[#150d24] border-[#2e1c52] hover:border-[#ec4899]/50 shadow-xs'
                        }`}
                      >
                        {/* Checkbox and Info */}
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <button
                            type="button"
                            onClick={() => handleToggleItem(item)}
                            className="mt-0.5 text-[#c084fc] hover:text-[#ec4899] cursor-pointer transition-colors shrink-0"
                            title={item.completed ? 'Mark pending' : 'Mark completed'}
                          >
                            {item.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
                            ) : (
                              <Circle className="w-5 h-5 hover:border-[#ec4899]" />
                            )}
                          </button>

                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-sm font-medium ${
                                  item.completed ? 'line-through text-[#c084fc]' : 'text-[#faf5ff]'
                                }`}
                              >
                                {item.title}
                              </span>

                              {/* Type badge */}
                              <span
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] border text-[10px] font-mono ${badge.bg}`}
                              >
                                <TypeIcon className="w-3 h-3" />
                                <span>{badge.label}</span>
                              </span>

                              {/* Priority */}
                              <span
                                className={`inline-flex items-center px-1.5 py-0.2 text-[9px] font-mono rounded border ${prio.bg} ${prio.color}`}
                              >
                                {prio.label}
                              </span>

                              {/* Time */}
                              {item.time && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#c084fc] bg-[#1f1338] px-2 py-0.5 rounded border border-[#2e1c52]">
                                  <Clock className="w-3 h-3 text-[#ec4899]" />
                                  <span>{item.time}{item.endTime ? ` - ${item.endTime}` : ''}</span>
                                </span>
                              )}
                            </div>

                            {/* Description if any */}
                            {item.description && (
                              <p className="text-xs text-[#c084fc]/80 leading-relaxed">
                                {item.description}
                              </p>
                            )}

                            {/* Origin note link */}
                            <div className="flex items-center gap-3 pt-0.5 text-[11px] text-[#c084fc]/70 flex-wrap">
                              {item.noteTitle && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (item.noteId) onSelectNote(item.noteId);
                                    else onNavigateToNote(item.noteTitle!);
                                  }}
                                  className="inline-flex items-center gap-1 text-[#ec4899] hover:underline cursor-pointer font-mono"
                                >
                                  <FileText className="w-3 h-3" />
                                  <span>{item.noteTitle}</span>
                                  {typeof item.lineNumber === 'number' && (
                                    <span className="text-[10px] text-[#c084fc]">:L{item.lineNumber + 1}</span>
                                  )}
                                </button>
                              )}

                              {item.sourceType === 'note-task' && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#1f1338] text-[#c084fc] border border-[#2e1c52]">
                                  Note Checklist
                                </span>
                              )}

                              {item.tags && item.tags.length > 0 && (
                                <div className="flex items-center gap-1">
                                  {item.tags.map((t) => (
                                    <span key={t} className="text-[10px] text-[#c084fc]/70 font-mono">
                                      #{t}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.sourceType === 'manual' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteManualItem(item.id)}
                              className="p-1.5 rounded hover:bg-rose-950/40 text-[#c084fc] hover:text-rose-400 cursor-pointer transition-colors"
                              title="Delete agenda item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {item.noteId && (
                            <button
                              type="button"
                              onClick={() => onSelectNote(item.noteId!)}
                              className="p-1.5 rounded hover:bg-[#1f1338] text-[#c084fc] hover:text-[#faf5ff] cursor-pointer"
                              title="Go to note"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* View 2: Day Schedule View (Hour by hour 08:00 to 20:00) */}
          {displayMode === 'day' && (
            <div className="max-w-4xl mx-auto space-y-2">
              <div className="p-3 bg-[#150d24] border border-[#2e1c52] rounded-xl mb-4 flex items-center justify-between">
                <span className="text-xs font-mono text-[#c084fc]">
                  Daily Timeline Schedule for <strong className="text-[#faf5ff]">{selectedDate}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenOrCreateDailyNote(selectedDate)}
                  className="text-xs font-mono text-[#ec4899] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <FileText className="w-3 h-3" />
                  <span>Open Daily Note</span>
                </button>
              </div>

              {/* Hourly Slots */}
              {Array.from({ length: 13 }, (_, i) => i + 8).map((hour) => {
                const hourStr = String(hour).padStart(2, '0') + ':00';
                const nextHourStr = String(hour + 1).padStart(2, '0') + ':00';
                const itemsInHour = displayedItems.filter((i) => {
                  if (!i.time) return false;
                  const itemHour = parseInt(i.time.split(':')[0], 10);
                  return itemHour === hour;
                });

                return (
                  <div
                    key={hour}
                    className="flex items-start gap-4 py-2 border-b border-[#2e1c52]/50 min-h-[56px] group"
                  >
                    <div className="w-16 shrink-0 text-xs font-mono text-[#c084fc]/70 pt-0.5">
                      {hourStr}
                    </div>

                    <div className="flex-1 space-y-1.5">
                      {itemsInHour.length === 0 ? (
                        <div className="h-6 flex items-center text-[11px] text-[#c084fc]/30 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => {
                              setNewDate(selectedDate);
                              setNewTime(hourStr);
                              setNewEndTime(nextHourStr);
                              setIsNewItemModalOpen(true);
                            }}
                            className="text-[#c084fc]/60 hover:text-[#ec4899] cursor-pointer inline-flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Schedule item at {hourStr}</span>
                          </button>
                        </div>
                      ) : (
                        itemsInHour.map((item) => {
                          const badge = getTypeBadge(item.type);
                          return (
                            <div
                              key={item.id}
                              className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 transition-all ${
                                item.completed
                                  ? 'bg-[#150d24]/50 border-[#2e1c52] opacity-60'
                                  : 'bg-[#1f1338] border-[#ec4899]/40 hover:border-[#ec4899]'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleToggleItem(item)}
                                  className="text-[#c084fc] hover:text-[#ec4899] cursor-pointer"
                                >
                                  {item.completed ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                  ) : (
                                    <Circle className="w-4 h-4" />
                                  )}
                                </button>
                                <span
                                  className={`text-xs font-medium ${
                                    item.completed ? 'line-through text-[#c084fc]' : 'text-[#faf5ff]'
                                  }`}
                                >
                                  {item.title}
                                </span>
                                <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${badge.bg}`}>
                                  {badge.label}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono text-[#c084fc]">
                                {item.time}{item.endTime ? ` - ${item.endTime}` : ''}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}

              {/* All Day / Untimed items for the day */}
              {displayedItems.filter((i) => !i.time).length > 0 && (
                <div className="mt-6 pt-4 border-t border-[#2e1c52]">
                  <h4 className="text-xs font-bold text-[#c084fc] uppercase tracking-wider font-mono mb-2">
                    All-Day Tasks & Unscheduled Items ({displayedItems.filter((i) => !i.time).length})
                  </h4>
                  <div className="space-y-1.5">
                    {displayedItems
                      .filter((i) => !i.time)
                      .map((item) => (
                        <div
                          key={item.id}
                          className="p-2 rounded-lg bg-[#150d24] border border-[#2e1c52] flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleItem(item)}
                              className="text-[#c084fc] hover:text-[#ec4899] cursor-pointer"
                            >
                              {item.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Circle className="w-4 h-4" />
                              )}
                            </button>
                            <span className={`text-xs ${item.completed ? 'line-through text-[#c084fc]' : ''}`}>
                              {item.title}
                            </span>
                          </div>
                          {item.noteTitle && (
                            <span className="text-[10px] font-mono text-[#ec4899]">{item.noteTitle}</span>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* View 3: Week View (Columns) */}
          {displayMode === 'week' && (
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3 h-full">
              {weekDays.map((wd) => {
                const dayItems = allItems.filter((i) => i.date === wd.dateKey);
                return (
                  <div
                    key={wd.dateKey}
                    className={`rounded-xl border flex flex-col p-3 transition-colors ${
                      wd.isSelected
                        ? 'bg-[#150d24] border-[#ec4899]'
                        : 'bg-[#150d24]/60 border-[#2e1c52]'
                    }`}
                  >
                    <div className="border-b border-[#2e1c52] pb-2 mb-2 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-mono font-bold uppercase text-[#c084fc]">
                          {wd.dayName}
                        </div>
                        <div className="text-sm font-bold text-[#faf5ff]">{wd.dayNum}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDate(wd.dateKey);
                          setNewDate(wd.dateKey);
                          setIsNewItemModalOpen(true);
                        }}
                        className="p-1 rounded hover:bg-[#1f1338] text-[#c084fc] hover:text-[#ec4899]"
                        title="Add item to this day"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[500px]">
                      {dayItems.length === 0 ? (
                        <div className="text-[10px] text-[#c084fc]/40 text-center py-4">
                          No items
                        </div>
                      ) : (
                        dayItems.map((item) => (
                          <div
                            key={item.id}
                            className={`p-2 rounded-lg border text-xs transition-all ${
                              item.completed
                                ? 'bg-[#150d24]/40 border-[#2e1c52]/60 opacity-60'
                                : 'bg-[#1f1338] border-[#2e1c52] hover:border-[#ec4899]/50'
                            }`}
                          >
                            <div className="flex items-start gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleToggleItem(item)}
                                className="mt-0.5 text-[#c084fc] hover:text-[#ec4899] cursor-pointer shrink-0"
                              >
                                {item.completed ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Circle className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <span
                                className={`text-[11px] line-clamp-2 leading-tight ${
                                  item.completed ? 'line-through text-[#c084fc]' : 'text-[#faf5ff]'
                                }`}
                              >
                                {item.title}
                              </span>
                            </div>
                            {item.time && (
                              <div className="text-[9px] font-mono text-[#c084fc]/70 mt-1 pl-5">
                                {item.time}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* View 4: All Tasks Matrix (Search & Organize vault tasks) */}
          {displayMode === 'matrix' && (
            <div className="max-w-4xl mx-auto space-y-3">
              <div className="p-3 bg-[#150d24] border border-[#2e1c52] rounded-xl flex items-center justify-between text-xs">
                <span className="font-mono text-[#c084fc]">
                  Showing all <strong className="text-[#faf5ff]">{displayedItems.length}</strong> tasks aggregated across your notes and vault.
                </span>
                <span className="text-[11px] font-mono text-emerald-400">
                  {displayedItems.filter((i) => i.completed).length} completed
                </span>
              </div>

              <div className="space-y-1.5">
                {displayedItems.map((item) => {
                  const badge = getTypeBadge(item.type);
                  return (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                        item.completed
                          ? 'bg-[#150d24]/40 border-[#2e1c52]/60 opacity-60'
                          : 'bg-[#150d24] border-[#2e1c52] hover:border-[#ec4899]/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleToggleItem(item)}
                          className="text-[#c084fc] hover:text-[#ec4899] cursor-pointer shrink-0"
                        >
                          {item.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>
                        <span
                          className={`text-xs truncate ${
                            item.completed ? 'line-through text-[#c084fc]' : 'text-[#faf5ff]'
                          }`}
                        >
                          {item.title}
                        </span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] font-mono text-[#c084fc] shrink-0">
                        <span className={item.date === todayKey ? 'text-[#ec4899] font-bold' : ''}>
                          {item.date}
                        </span>
                        {item.noteTitle && (
                          <button
                            type="button"
                            onClick={() => {
                              if (item.noteId) onSelectNote(item.noteId);
                            }}
                            className="text-[#ec4899] hover:underline truncate max-w-[150px]"
                          >
                            {item.noteTitle}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Info & Date Picker Sidebar */}
        <div className="w-72 bg-[#150d24] border-l border-[#2e1c52] p-4 flex flex-col gap-4 shrink-0 hidden lg:flex">
          {/* Daily Progress Widget */}
          <div className="p-3.5 rounded-xl bg-[#1f1338] border border-[#2e1c52] space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#c084fc] uppercase font-bold tracking-wider">Day Progress</span>
              <span className="text-emerald-400 font-bold">{metrics.percent}%</span>
            </div>

            <div className="w-full bg-[#150d24] h-2 rounded-full overflow-hidden border border-[#2e1c52]">
              <div
                className="bg-gradient-to-r from-[#ec4899] to-emerald-400 h-full transition-all duration-300"
                style={{ width: `${metrics.percent}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-center text-xs pt-1">
              <div className="p-2 rounded bg-[#150d24] border border-[#2e1c52]">
                <div className="text-[10px] text-[#c084fc] font-mono uppercase">Completed</div>
                <div className="text-base font-bold text-emerald-400">{metrics.completed}</div>
              </div>
              <div className="p-2 rounded bg-[#150d24] border border-[#2e1c52]">
                <div className="text-[10px] text-[#c084fc] font-mono uppercase">Remaining</div>
                <div className="text-base font-bold text-[#faf5ff]">{metrics.pending}</div>
              </div>
            </div>
          </div>

          {/* Quick Date Jump Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono font-bold text-[#c084fc] uppercase tracking-wider">
              Jump to Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) setSelectedDate(e.target.value);
              }}
              className="w-full px-2.5 py-1.5 text-xs rounded-[6px] bg-[#1f1338] border border-[#2e1c52] text-[#faf5ff] focus:outline-none focus:border-[#ec4899] font-mono cursor-pointer"
            />
          </div>

          {/* Daily Note Integration Card */}
          <div className="p-3.5 rounded-xl bg-[#1f1338] border border-[#2e1c52] space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#faf5ff]">
              <FileText className="w-4 h-4 text-[#ec4899]" />
              <span>Daily Vault Note</span>
            </div>
            <p className="text-[11px] text-[#c084fc]/80 leading-relaxed">
              Open or create today's daily markdown file with embedded task tracking and reflections.
            </p>
            <button
              type="button"
              onClick={() => handleOpenOrCreateDailyNote(selectedDate)}
              className="w-full py-2 px-3 rounded-[6px] bg-[#ec4899] hover:bg-[#db2777] text-white text-xs font-semibold transition-colors cursor-pointer text-center"
            >
              Open Daily Note ({selectedDate})
            </button>
          </div>

          {/* Tips for Markdown Agenda */}
          <div className="p-3 rounded-xl bg-[#150d24] border border-[#2e1c52] space-y-1.5 text-[11px] text-[#c084fc]">
            <span className="font-mono text-[#faf5ff] font-semibold block">💡 Pro-Tip</span>
            <p className="leading-relaxed">
              Any checklist task in your notes automatically syncs to your agenda when you add dates:
            </p>
            <div className="p-2 rounded bg-[#0c0714] border border-[#2e1c52] font-mono text-[10px] text-pink-300">
              - [ ] Sync with design due: {todayKey} #meeting
            </div>
          </div>
        </div>
      </div>

      {/* New Agenda Item Modal */}
      {isNewItemModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
          onClick={() => setIsNewItemModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#150d24] border border-[#3b2366] rounded-xl shadow-2xl p-5 text-[#faf5ff] font-['Space_Grotesk',sans-serif] space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#2e1c52] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-[6px] bg-[#ec4899]/15 text-[#ec4899]">
                  <CalendarDays className="w-4 h-4 text-[#ec4899]" />
                </div>
                <h3 className="font-bold text-sm text-[#faf5ff]">New Agenda Item</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewItemModalOpen(false)}
                className="p-1 text-[#c084fc] hover:text-[#faf5ff] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewItem} className="space-y-3.5">
              {/* Title */}
              <div>
                <label className="block text-xs font-mono text-[#c084fc] mb-1">Title *</label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="e.g., Team Design Sync, Review Backlinks..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-[6px] bg-[#1f1338] border border-[#2e1c52] text-[#faf5ff] focus:outline-none focus:border-[#ec4899]"
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-mono text-[#c084fc] mb-1">Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-[6px] bg-[#1f1338] border border-[#2e1c52] text-[#faf5ff] focus:outline-none focus:border-[#ec4899] font-mono"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-mono text-[#c084fc]">Time</label>
                    <label className="text-[10px] text-[#c084fc] flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newIsAllDay}
                        onChange={(e) => setNewIsAllDay(e.target.checked)}
                      />
                      <span>All Day</span>
                    </label>
                  </div>
                  {!newIsAllDay ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="time"
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                        className="w-1/2 px-2 py-1.5 text-xs rounded-[6px] bg-[#1f1338] border border-[#2e1c52] text-[#faf5ff] focus:outline-none focus:border-[#ec4899] font-mono"
                      />
                      <input
                        type="time"
                        value={newEndTime}
                        onChange={(e) => setNewEndTime(e.target.value)}
                        className="w-1/2 px-2 py-1.5 text-xs rounded-[6px] bg-[#1f1338] border border-[#2e1c52] text-[#faf5ff] focus:outline-none focus:border-[#ec4899] font-mono"
                      />
                    </div>
                  ) : (
                    <div className="py-1.5 px-2 text-xs text-[#c084fc]/50 bg-[#1f1338] rounded border border-[#2e1c52] font-mono">
                      All day event
                    </div>
                  )}
                </div>
              </div>

              {/* Type & Priority */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-mono text-[#c084fc] mb-1">Category</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as AgendaItemType)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-[6px] bg-[#1f1338] border border-[#2e1c52] text-[#faf5ff] focus:outline-none focus:border-[#ec4899]"
                  >
                    <option value="task">Task</option>
                    <option value="meeting">Meeting</option>
                    <option value="deadline">Deadline</option>
                    <option value="event">Event</option>
                    <option value="reminder">Reminder</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#c084fc] mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as AgendaPriority)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-[6px] bg-[#1f1338] border border-[#2e1c52] text-[#faf5ff] focus:outline-none focus:border-[#ec4899]"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
              </div>

              {/* Link to existing note (optional) */}
              <div>
                <label className="block text-xs font-mono text-[#c084fc] mb-1">Link to Note (Optional)</label>
                <select
                  value={newNoteLink}
                  onChange={(e) => setNewNoteLink(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-[6px] bg-[#1f1338] border border-[#2e1c52] text-[#faf5ff] focus:outline-none focus:border-[#ec4899]"
                >
                  <option value="">No linked note</option>
                  {notes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.title || n.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-mono text-[#c084fc] mb-1">Details (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Notes, agenda topics or location..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-[6px] bg-[#1f1338] border border-[#2e1c52] text-[#faf5ff] focus:outline-none focus:border-[#ec4899] resize-none"
                />
              </div>

              {/* Append to Daily Note option */}
              <div className="flex items-center gap-2 p-2 rounded bg-[#1f1338] border border-[#2e1c52]">
                <input
                  type="checkbox"
                  id="sync-to-daily-note-cb"
                  checked={newSyncToDailyNote}
                  onChange={(e) => setNewSyncToDailyNote(e.target.checked)}
                  className="cursor-pointer"
                />
                <label htmlFor="sync-to-daily-note-cb" className="text-xs text-[#faf5ff] cursor-pointer">
                  Append item directly into Daily Note (<span className="font-mono text-[#ec4899]">{newDate}.md</span>)
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewItemModalOpen(false)}
                  className="px-3 py-1.5 text-xs rounded-[6px] text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#1f1338] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs rounded-[6px] bg-[#ec4899] hover:bg-[#db2777] text-white font-semibold cursor-pointer"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
