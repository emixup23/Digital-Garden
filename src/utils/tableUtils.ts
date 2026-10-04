export type ColumnAlignment = 'left' | 'center' | 'right';

export interface ParsedTable {
  headers: string[];
  alignments: ColumnAlignment[];
  rows: string[][];
  rawText: string;
}

export interface TablePreset {
  id: string;
  name: string;
  description: string;
  category: 'general' | 'sysadmin' | 'cloud' | 'planning';
  headers: string[];
  alignments: ColumnAlignment[];
  rows: string[][];
}

export const TABLE_PRESETS: TablePreset[] = [
  {
    id: 'simple-3x3',
    name: 'Standard 3 × 3 Grid',
    description: 'Clean default table with balanced headers and sample cells',
    category: 'general',
    headers: ['Item / Name', 'Category', 'Details'],
    alignments: ['left', 'left', 'left'],
    rows: [
      ['Alpha Project', 'Core', 'Initial milestone complete'],
      ['Beta Service', 'Backend', 'Under active development'],
      ['Gamma Cluster', 'DevOps', 'Staging deployment verified'],
    ],
  },
  {
    id: 'sysadmin-servers',
    name: '🐧 Linux & Server Inventory',
    description: 'Server fleet tracking with host, IP, distro, service, and status',
    category: 'sysadmin',
    headers: ['Hostname', 'IP Address', 'OS / Distro', 'Role / Services', 'Status'],
    alignments: ['left', 'left', 'left', 'left', 'center'],
    rows: [
      ['prod-web-01', '10.0.1.10', 'Ubuntu 24.04 LTS', 'Nginx, Reverse Proxy', '🟢 Active'],
      ['prod-db-primary', '10.0.2.15', 'Debian 12 Bookworm', 'PostgreSQL 16, Redis', '🟢 Active'],
      ['k8s-master-01', '10.0.3.20', 'Rocky Linux 9', 'Kubernetes Control Plane', '🟢 Healthy'],
      ['backup-storage', '10.0.4.30', 'Arch Linux / ZFS', 'BorgBackup, MinIO S3', '🟡 Syncing'],
    ],
  },
  {
    id: 'cloud-infrastructure',
    name: '☁️ Cloud Resources & Cost',
    description: 'Cloud resource matrix with provider, region, spec, and monthly spend',
    category: 'cloud',
    headers: ['Service Name', 'Cloud Provider', 'Region', 'Instance / Tier', 'Monthly Cost'],
    alignments: ['left', 'left', 'center', 'left', 'right'],
    rows: [
      ['App Cluster (EKS)', 'AWS', 'us-east-1', 'm6i.xlarge (3 nodes)', '$345.60'],
      ['Managed Cloud SQL', 'Google Cloud', 'europe-west2', 'db-custom-4-16384', '$182.50'],
      ['Edge CDN & DNS', 'Cloudflare', 'Global Edge', 'Enterprise / Pro', '$40.00'],
      ['Blob Storage Bucket', 'AWS S3', 'eu-central-1', 'Standard (1.2 TB)', '$27.60'],
    ],
  },
  {
    id: 'task-sprint',
    name: '📋 Task & Milestone Tracker',
    description: 'Sprint backlog with assignees, priority, target dates, and status',
    category: 'planning',
    headers: ['Task Description', 'Assignee', 'Priority', 'Target Due', 'Status'],
    alignments: ['left', 'left', 'center', 'center', 'center'],
    rows: [
      ['Configure WireGuard VPN gateway', 'DevOps Team', '🔴 High', '2026-10-05', 'In Progress'],
      ['Migrate auth tokens to OAuth 2.1', 'Security Lead', '🟡 Medium', '2026-10-12', 'Planning'],
      ['Setup Prometheus + Grafana alerts', 'SysAdmin', '🔴 High', '2026-10-02', 'Completed'],
      ['Audit IAM roles and least privilege', 'SecOps', '🟢 Low', '2026-10-20', 'Pending'],
    ],
  },
  {
    id: 'api-reference',
    name: '🔌 REST API Endpoint Spec',
    description: 'API endpoint schema with HTTP verb, path, auth requirement, and codes',
    category: 'general',
    headers: ['HTTP Method', 'Endpoint Path', 'Auth Required', 'Description', 'Success Code'],
    alignments: ['center', 'left', 'center', 'left', 'center'],
    rows: [
      ['`GET`', '`/api/v1/vault/notes`', 'Bearer Token', 'List all encrypted vault documents', '`200 OK`'],
      ['`POST`', '`/api/v1/vault/notes`', 'Bearer Token', 'Create new markdown document', '`201 Created`'],
      ['`PUT`', '`/api/v1/vault/notes/:id`', 'Bearer Token', 'Update markdown content or tags', '`200 OK`'],
      ['`DELETE`', '`/api/v1/vault/notes/:id`', 'Bearer Token', 'Move document to trash vault', '`204 No Content`'],
    ],
  },
  {
    id: 'feature-comparison',
    name: '⚖️ Feature Comparison Matrix',
    description: 'Feature matrix comparing Free, Pro, and Enterprise editions',
    category: 'planning',
    headers: ['Feature Capability', 'Community / Free', 'Professional', 'Enterprise Suite'],
    alignments: ['left', 'center', 'center', 'center'],
    rows: [
      ['Local Vault Storage', '✅ Unlimited', '✅ Unlimited', '✅ Unlimited'],
      ['Bi-directional Linking', '✅ Included', '✅ Included', '✅ Included'],
      ['Full-Text Search & Indexing', '✅ Instant', '✅ Instant', '✅ Instant + Semantic'],
      ['Automated Backups & Snapshots', 'Manual / Local', '✅ Daily Cloud', '✅ Real-time Multi-Region'],
      ['Sysadmin CLI & API Access', '—', '✅ Included', '✅ Dedicated VPC / Air-Gapped'],
    ],
  },
];

/**
 * Cleanly split a markdown table row by unescaped pipe (|) characters.
 */
export function splitTableRow(line: string): string[] {
  const trimmed = line.trim();
  let content = trimmed;

  // Strip leading pipe if present
  if (content.startsWith('|')) {
    content = content.slice(1);
  }
  // Strip trailing pipe if present
  if (content.endsWith('|')) {
    content = content.slice(0, -1);
  }

  const cells: string[] = [];
  let currentCell = '';
  let isEscaped = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    if (isEscaped) {
      currentCell += char;
      isEscaped = false;
      continue;
    }

    if (char === '\\') {
      isEscaped = true;
      currentCell += char;
      continue;
    }

    if (char === '|') {
      cells.push(currentCell.trim());
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  cells.push(currentCell.trim());
  return cells;
}

/**
 * Checks if a delimiter cell defines alignment.
 */
export function parseDelimiterAlignment(cell: string): ColumnAlignment {
  const trimmed = cell.trim();
  const startsWithColon = trimmed.startsWith(':');
  const endsWithColon = trimmed.endsWith(':');

  if (startsWithColon && endsWithColon) {
    return 'center';
  }
  if (endsWithColon) {
    return 'right';
  }
  return 'left';
}

/**
 * Checks if a line matches markdown table delimiter pattern:
 * e.g., | --- | :---: | ---: | or --- | :---: | ---
 */
export function isTableDelimiterLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes('-')) return false;

  // Must contain pipe delimiter or be composed of dashes and colons separated by |
  const cells = splitTableRow(trimmed);
  if (cells.length < 1) return false;

  return cells.every((cell) => {
    const c = cell.trim();
    return /^:?-+:?$/.test(c);
  });
}

/**
 * Parses a contiguous block of text into a ParsedTable, or returns null if invalid.
 */
export function parseMarkdownTable(rawText: string): ParsedTable | null {
  const lines = rawText.split('\n').map((l) => l.trimEnd()).filter(Boolean);
  if (lines.length < 2) return null;

  const headerLine = lines[0];
  const delimiterLine = lines[1];

  if (!isTableDelimiterLine(delimiterLine)) {
    return null;
  }

  const headers = splitTableRow(headerLine);
  const delimiterCells = splitTableRow(delimiterLine);

  if (headers.length === 0 || delimiterCells.length === 0) {
    return null;
  }

  const columnCount = Math.max(headers.length, delimiterCells.length);

  // Normalize alignments
  const alignments: ColumnAlignment[] = [];
  for (let i = 0; i < columnCount; i++) {
    alignments.push(
      i < delimiterCells.length ? parseDelimiterAlignment(delimiterCells[i]) : 'left'
    );
  }

  // Ensure headers match columnCount
  while (headers.length < columnCount) {
    headers.push(`Column ${headers.length + 1}`);
  }

  const rows: string[][] = [];
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const rowCells = splitTableRow(line);
    // Pad or trim to match column count
    while (rowCells.length < columnCount) {
      rowCells.push('');
    }
    rows.push(rowCells.slice(0, columnCount));
  }

  return {
    headers,
    alignments,
    rows,
    rawText,
  };
}

/**
 * Formats a 2D table structure into standard, pretty-aligned GitHub Flavored Markdown (GFM).
 */
export function formatMarkdownTable(options: {
  headers: string[];
  rows: string[][];
  alignments?: ColumnAlignment[];
}): string {
  const { headers, rows } = options;
  const colCount = Math.max(headers.length, ...rows.map((r) => r.length));
  if (colCount === 0) return '';

  const normalizedHeaders = [...headers];
  while (normalizedHeaders.length < colCount) {
    normalizedHeaders.push(`Column ${normalizedHeaders.length + 1}`);
  }

  const alignments: ColumnAlignment[] = options.alignments || [];
  while (alignments.length < colCount) {
    alignments.push('left');
  }

  const normalizedRows = rows.map((row) => {
    const padded = [...row];
    while (padded.length < colCount) {
      padded.push('');
    }
    return padded;
  });

  // Calculate maximum width for each column to make raw markdown neatly aligned
  const colWidths = normalizedHeaders.map((header, idx) => {
    let max = Math.max(header.length, 3);
    for (const r of normalizedRows) {
      const cell = r[idx] || '';
      if (cell.length > max) {
        max = cell.length;
      }
    }
    return max;
  });

  // Helper to format a cell with alignment padding
  const formatCell = (val: string, colIdx: number, align: ColumnAlignment): string => {
    const width = colWidths[colIdx];
    const cleanVal = val.replace(/\r?\n/g, ' ');
    if (align === 'right') {
      return cleanVal.padStart(width, ' ');
    }
    if (align === 'center') {
      const totalPad = Math.max(0, width - cleanVal.length);
      const leftPad = Math.floor(totalPad / 2);
      const rightPad = totalPad - leftPad;
      return ' '.repeat(leftPad) + cleanVal + ' '.repeat(rightPad);
    }
    return cleanVal.padEnd(width, ' ');
  };

  // Header line
  const headerParts = normalizedHeaders.map((h, idx) => formatCell(h, idx, alignments[idx]));
  const headerLine = `| ${headerParts.join(' | ')} |`;

  // Delimiter line
  const delimiterParts = alignments.map((align, idx) => {
    const width = Math.max(colWidths[idx], 3);
    if (align === 'center') {
      return `:${'-'.repeat(Math.max(1, width - 2))}:`;
    }
    if (align === 'right') {
      return `${'-'.repeat(Math.max(2, width - 1))}:`;
    }
    return `:${'-'.repeat(Math.max(2, width - 1))}`;
  });
  const delimiterLine = `| ${delimiterParts.join(' | ')} |`;

  // Data rows
  const dataLines = normalizedRows.map((row) => {
    const rowParts = row.map((cell, idx) => formatCell(cell, idx, alignments[idx]));
    return `| ${rowParts.join(' | ')} |`;
  });

  return [headerLine, delimiterLine, ...dataLines].join('\n');
}

/**
 * Exports a parsed table to CSV format.
 */
export function tableToCSV(headers: string[], rows: string[][]): string {
  const escapeCSV = (field: string) => {
    const cleaned = field.replace(/"/g, '""');
    if (cleaned.includes(',') || cleaned.includes('"') || cleaned.includes('\n')) {
      return `"${cleaned}"`;
    }
    return cleaned;
  };

  const lines = [
    headers.map(escapeCSV).join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ];
  return lines.join('\n');
}

/**
 * Creates blank grid of rows and columns.
 */
export function createBlankTable(
  columnsCount: number,
  rowsCount: number,
  defaultAlign: ColumnAlignment = 'left'
): { headers: string[]; rows: string[][]; alignments: ColumnAlignment[] } {
  const safeCols = Math.max(1, Math.min(columnsCount, 15));
  const safeRows = Math.max(1, Math.min(rowsCount, 50));

  const headers = Array.from({ length: safeCols }, (_, i) => `Header ${i + 1}`);
  const alignments = Array.from({ length: safeCols }, () => defaultAlign);
  const rows = Array.from({ length: safeRows }, () =>
    Array.from({ length: safeCols }, () => '')
  );

  return { headers, rows, alignments };
}
