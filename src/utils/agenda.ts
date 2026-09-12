import { NoteFile } from '../types';

export type AgendaItemType = 'task' | 'meeting' | 'event' | 'reminder' | 'deadline';
export type AgendaPriority = 'low' | 'medium' | 'high';

export interface AgendaItem {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time?: string; // e.g. "09:30" or "10:00 AM"
  endTime?: string; // e.g. "10:30"
  allDay?: boolean;
  completed: boolean;
  type: AgendaItemType;
  priority: AgendaPriority;
  noteId?: string; // linked note ID if extracted from note or linked
  noteTitle?: string;
  sourceType: 'manual' | 'note-task';
  lineNumber?: number; // 0-indexed line in note content
  tags?: string[];
  createdAt: number;
}

const STORAGE_KEY_AGENDA = 'pkm_agenda_manual_items_v1';

/**
 * Format Date to YYYY-MM-DD in local time
 */
export function formatDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse a date string YYYY-MM-DD into a localized display format
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Default sample agenda items to seed when user opens Agenda for the first time
 */
export function getInitialAgendaItems(): AgendaItem[] {
  const today = formatDateKey(new Date());
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = formatDateKey(tomorrow);

  return [
    {
      id: 'agenda-init-1',
      title: 'Weekly Architecture Review & System Sync',
      description: 'Discuss bidirectional graph indexing and offline data persistence.',
      date: today,
      time: '10:00',
      endTime: '11:00',
      allDay: false,
      completed: false,
      type: 'meeting',
      priority: 'high',
      sourceType: 'manual',
      tags: ['architecture', 'sync'],
      createdAt: Date.now() - 3600000 * 2,
    },
    {
      id: 'agenda-init-2',
      title: 'Review PKM knowledge graph backlinks',
      description: 'Audit unlinked mentions and organize tag hierarchy.',
      date: today,
      time: '13:30',
      endTime: '14:15',
      allDay: false,
      completed: true,
      type: 'task',
      priority: 'medium',
      sourceType: 'manual',
      tags: ['notes', 'graph'],
      createdAt: Date.now() - 3600000 * 4,
    },
    {
      id: 'agenda-init-3',
      title: 'Update daily notes with sprint retrospectives',
      date: today,
      allDay: true,
      completed: false,
      type: 'task',
      priority: 'low',
      sourceType: 'manual',
      tags: ['daily'],
      createdAt: Date.now() - 3600000 * 5,
    },
    {
      id: 'agenda-init-4',
      title: 'Sync with frontend lead on Markdown shortcuts',
      date: tomorrowKey,
      time: '11:00',
      endTime: '11:45',
      allDay: false,
      completed: false,
      type: 'meeting',
      priority: 'high',
      sourceType: 'manual',
      tags: ['meeting', 'frontend'],
      createdAt: Date.now() - 3600000 * 6,
    },
    {
      id: 'agenda-init-5',
      title: 'Verify offline IndexedDB sync fallback',
      date: tomorrowKey,
      time: '15:00',
      allDay: false,
      completed: false,
      type: 'deadline',
      priority: 'high',
      sourceType: 'manual',
      tags: ['security', 'offline'],
      createdAt: Date.now() - 3600000 * 7,
    },
  ];
}

/**
 * Load manual agenda items from localStorage
 */
export function loadManualAgendaItems(): AgendaItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AGENDA);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load manual agenda items', err);
  }
  const initial = getInitialAgendaItems();
  saveManualAgendaItems(initial);
  return initial;
}

/**
 * Save manual agenda items to localStorage
 */
export function saveManualAgendaItems(items: AgendaItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_AGENDA, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save manual agenda items', err);
  }
}

/**
 * Regex patterns for extracting tasks and dates from Markdown
 */
const CHECKLIST_REGEX = /^(\s*)[-*+]\s*\[([ xX])\]\s*(.*)$/;
const DATE_PATTERNS = [
  /(?:📅|@|due:|date:|on:)\s*(\d{4}-\d{2}-\d{2})/i,
  /\b(\d{4}-\d{2}-\d{2})\b/,
];
const TIME_PATTERN = /\b((?:0?[1-9]|1[0-2]):[0-5][0-9]\s*(?:AM|PM|am|pm)|(?:[01]?[0-9]|2[0-3]):[0-5][0-9])\b/;
const TAG_PATTERN = /#([a-zA-Z0-9_\-]+)/g;

/**
 * Scan all notes and extract checklist tasks as dynamic agenda items
 */
export function extractTasksFromNotes(notes: NoteFile[]): AgendaItem[] {
  const extracted: AgendaItem[] = [];
  const todayKey = formatDateKey(new Date());

  for (const note of notes) {
    // Check if the note is a daily note e.g. "2026-09-07.md" or "Daily 2026-09-07"
    let noteDateKey: string | null = null;
    const noteNameMatch = note.name.match(/(\d{4}-\d{2}-\d{2})/);
    const noteTitleMatch = note.title.match(/(\d{4}-\d{2}-\d{2})/);
    if (noteNameMatch) {
      noteDateKey = noteNameMatch[1];
    } else if (noteTitleMatch) {
      noteDateKey = noteTitleMatch[1];
    }

    const lines = note.content.split('\n');
    lines.forEach((line, lineIndex) => {
      const match = line.match(CHECKLIST_REGEX);
      if (!match) return;

      const isCompleted = match[2].toLowerCase() === 'x';
      const rawText = match[3].trim();
      if (!rawText) return;

      // Detect explicit date in line
      let dateKey = noteDateKey || todayKey;
      for (const pattern of DATE_PATTERNS) {
        const dMatch = rawText.match(pattern);
        if (dMatch) {
          dateKey = dMatch[1];
          break;
        }
      }

      // Detect explicit time
      let time: string | undefined = undefined;
      const tMatch = rawText.match(TIME_PATTERN);
      if (tMatch) {
        time = tMatch[1];
      }

      // Detect tags
      const tags: string[] = [];
      let tagMatch: RegExpExecArray | null;
      const tagRegex = new RegExp(TAG_PATTERN);
      while ((tagMatch = tagRegex.exec(rawText)) !== null) {
        tags.push(tagMatch[1]);
      }

      // Clean display title (remove explicit date marker for clean reading)
      let cleanTitle = rawText
        .replace(/(?:📅|@|due:|date:|on:)\s*\d{4}-\d{2}-\d{2}/gi, '')
        .trim();

      // Determine item type
      let type: AgendaItemType = 'task';
      const lower = rawText.toLowerCase();
      if (lower.includes('meeting') || lower.includes('sync') || lower.includes('call') || tags.includes('meeting')) {
        type = 'meeting';
      } else if (lower.includes('deadline') || lower.includes('due') || tags.includes('deadline')) {
        type = 'deadline';
      } else if (lower.includes('event') || tags.includes('event')) {
        type = 'event';
      } else if (lower.includes('reminder') || tags.includes('reminder')) {
        type = 'reminder';
      }

      // Determine priority
      let priority: AgendaPriority = 'medium';
      if (lower.includes('urgent') || lower.includes('high priority') || tags.includes('urgent') || tags.includes('p1')) {
        priority = 'high';
      } else if (lower.includes('low priority') || tags.includes('low') || tags.includes('p3')) {
        priority = 'low';
      }

      extracted.push({
        id: `note-task-${note.id}-${lineIndex}`,
        title: cleanTitle || rawText,
        date: dateKey,
        time,
        allDay: !time,
        completed: isCompleted,
        type,
        priority,
        noteId: note.id,
        noteTitle: note.title || note.name.replace(/\.(md|mf)$/i, ''),
        sourceType: 'note-task',
        lineNumber: lineIndex,
        tags: tags.length > 0 ? tags : note.tags,
        createdAt: note.updatedAt || note.createdAt,
      });
    });
  }

  return extracted;
}

/**
 * Toggle a task in a note's markdown text directly
 */
export function toggleTaskInNoteContent(
  content: string,
  lineNumber: number,
  newCompleted: boolean
): string {
  const lines = content.split('\n');
  if (lineNumber < 0 || lineNumber >= lines.length) return content;

  const line = lines[lineNumber];
  const match = line.match(CHECKLIST_REGEX);
  if (!match) return content;

  const indent = match[1];
  const rest = match[3];
  const char = newCompleted ? 'x' : ' ';
  lines[lineNumber] = `${indent}- [${char}] ${rest}`;

  return lines.join('\n');
}

/**
 * Generate starter markdown content for a Daily Note
 */
export function generateDailyNoteTemplate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const formattedHeader = d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return `# Daily Note — ${formattedHeader}

## 🎯 Top Priorities & Focus
- [ ] Complete primary deliverable for today
- [ ] Review pending pull requests and documentation

## 📅 Schedule & Meetings
- [ ] 10:00 - 10:30 Team Standup #meeting
- [ ] 14:00 - 15:00 Architecture & Knowledge Graph Sync #meeting

## 📋 Action Items & Tasks
- [ ] Follow up on offline sync checks
- [ ] Clean up tags and link unreferenced ideas

## 💡 Notes, Discoveries & Logs
* Notes taken throughout the day:
* 

## 🌙 Evening Reflection
* What went well today?
* What can be improved tomorrow?
`;
}
