import { NoteFile, Folder } from '../types';

export const INITIAL_FOLDERS: Folder[] = [
  {
    id: 'folder-systems',
    name: '01 - Systems',
    parentId: null,
    icon: 'Layers',
    iconColor: '#c084fc',
    createdAt: Date.now() - 86400000 * 7,
  },
  {
    id: 'folder-concepts',
    name: '02 - Concepts',
    parentId: null,
    icon: 'Brain',
    iconColor: '#ec4899',
    createdAt: Date.now() - 86400000 * 6,
  },
  {
    id: 'folder-projects',
    name: '03 - Projects',
    parentId: null,
    icon: 'Rocket',
    iconColor: '#10b981',
    createdAt: Date.now() - 86400000 * 5,
  },
];

export const INITIAL_NOTES: NoteFile[] = [
  {
    id: 'note-pkm-core',
    name: 'Personal Knowledge Management.md',
    folderId: 'folder-systems',
    title: 'Personal Knowledge Management',
    tags: ['pkm', 'systems', 'productivity'],
    icon: 'Workflow',
    iconColor: '#c084fc',
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 1,
    content: `---
title: "Personal Knowledge Management"
tags: ["pkm", "systems", "productivity"]
date: "2026-08-30"
---
# Personal Knowledge Management

A Personal Knowledge Management (PKM) system is an interconnected collection of processes used by knowledge workers to collect, classify, synthesize, and retrieve information.

## Core Pillars
1. **Atomic Notes**: Break thoughts down into self-contained conceptual units as in the [[Zettelkasten Method]].
2. **Organic Structure**: Rather than rigid folder silos, rely on [[Bidirectional Linking]] and associative tags.
3. **Exploratory Navigation**: Traversing insights through [[Graph Topology]] reveals emergent links between domains.

## Related Frameworks
- See also [[Digital Garden Architecture]] for how knowledge is cultivated over time.
- Check current implementation progress in [[Knowledge Engine 2026]].

#systems #pkm #productivity`,
  },
  {
    id: 'note-bidirectional',
    name: 'Bidirectional Linking.md',
    folderId: 'folder-systems',
    title: 'Bidirectional Linking',
    tags: ['graph', 'linking', 'pkm'],
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 1,
    content: `---
title: "Bidirectional Linking"
tags: ["graph", "linking", "pkm"]
date: "2026-08-31"
---
# Bidirectional Linking

Bidirectional links connect two documents reciprocally. When Note A references Note B via an explicit wiki-link \`[[Note B]]\`, Note B automatically registers a backlink to Note A without manual intervention.

## Why Bidirectional Navigation Matters
- Prevents dead-end notes by making reference contexts explicit.
- Deeply enriches [[Personal Knowledge Management]] systems.
- Mirrors neural associative pathways detailed in [[Associative Indexing]].
- Forms cyclical edges in [[Graph Topology]], identifying core hubs of ideas.

## Bidirectional Symmetry
When Note A points to Note B and Note B also references Note A, the graph marks this connection as a mutual, high-strength bond. Try clicking any node in the graph viewer to inspect its reciprocal backlinks!

#graph #linking #pkm`,
  },
  {
    id: 'note-zettelkasten',
    name: 'Zettelkasten Method.md',
    folderId: 'folder-concepts',
    title: 'Zettelkasten Method',
    tags: ['methodology', 'pkm', 'writing'],
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 2,
    content: `---
title: "Zettelkasten Method"
tags: ["methodology", "pkm", "writing"]
date: "2026-08-31"
---
# Zettelkasten Method

The Zettelkasten ("slip box") system was developed by sociologist Niklas Luhmann to produce over 70 books and hundreds of scholarly articles.

## Cardinal Rules
- **Atomicity**: Each note should contain exactly one core idea.
- **Connectivity**: A note is only as valuable as its links. Connect it to existing notes like [[Personal Knowledge Management]] and [[Digital Garden Architecture]].
- **Emergence**: Insights emerge from clustering rather than top-down hierarchical taxonomy.

Linked into our active reading schedule: [[Syntopic Reading List]].

#methodology #pkm #writing`,
  },
  {
    id: 'note-digital-garden',
    name: 'Digital Garden Architecture.md',
    folderId: 'folder-systems',
    title: 'Digital Garden Architecture',
    tags: ['gardening', 'systems', 'web'],
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 1,
    content: `---
title: "Digital Garden Architecture"
tags: ["gardening", "systems", "web"]
date: "2026-09-01"
---
# Digital Gardening

Digital gardening is an alternative to traditional chronological streams (like blogs or feeds). Notes are planted as seedlings and continuously cultivated, pruned, and cross-pollinated.

## Stages of a Note
1. **Seedling**: Fleeting observation or raw excerpt.
2. **Budding**: Synthesized with connections to [[Zettelkasten Method]] and [[Associative Indexing]].
3. **Evergreen**: Polished, foundational resource with rich backlinks.

## Structural Integration
Gardens heavily leverage [[Bidirectional Linking]] to allow readers to explore along thematic trails rather than date stamps.

#gardening #systems #web`,
  },
  {
    id: 'note-graph-topology',
    name: 'Graph Topology.md',
    folderId: 'folder-concepts',
    title: 'Graph Topology',
    tags: ['graph', 'theory', 'visualization'],
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 1,
    content: `---
title: "Graph Topology"
tags: ["graph", "theory", "visualization"]
date: "2026-09-01"
---
# Graph Topology & Knowledge Graphs

A knowledge base is mathematically structured as a directed graph $G = (V, E)$, where vertices $V$ represent notes and edges $E$ denote citations or wiki-links.

## Topology Metrics
- **Degree Centrality**: Number of direct links connected to a note.
- **Betweenness**: Notes that serve as bridges between disparate subject clusters.
- **Reciprocity**: The ratio of mutual edges generated through [[Bidirectional Linking]].

This topology forms the interactive foundation of [[Personal Knowledge Management]] and guides search ranking in [[Knowledge Engine 2026]].

#graph #theory #visualization`,
  },
  {
    id: 'note-associative-indexing',
    name: 'Associative Indexing.md',
    folderId: 'folder-concepts',
    title: 'Associative Indexing',
    tags: ['cognition', 'indexing', 'pkm'],
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 1,
    content: `---
title: "Associative Indexing"
tags: ["cognition", "indexing", "pkm"]
date: "2026-09-02"
---
# Associative Indexing

Proposed in Vannevar Bush's seminal 1945 essay *As We May Think*, associative indexing mirrors how the human mind operates by association rather than strict indexing classifications.

## Practical Implementation
- Wiki-links connect concepts across discipline boundaries.
- Works hand-in-hand with [[Bidirectional Linking]] to generate emergent webs of thoughts.
- Forms the biological justification for [[Personal Knowledge Management]].

Check references in [[Syntopic Reading List]].

#cognition #indexing #pkm`,
  },
  {
    id: 'note-syntopic-reading',
    name: 'Syntopic Reading List.md',
    folderId: 'folder-projects',
    title: 'Syntopic Reading List',
    tags: ['reading', 'research', 'books'],
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 1,
    content: `---
title: "Syntopic Reading List"
tags: ["reading", "research", "books"]
date: "2026-09-02"
---
# Syntopic Reading: Comparative Studies

Syntopic reading involves analyzing multiple texts simultaneously on a single subject to construct an independent synthesis.

## Active Tracks
- [x] Mortimer Adler — *How to Read a Book*
- [x] Sönke Ahrens — *How to Take Smart Notes* (connected to [[Zettelkasten Method]])
- [ ] Vannevar Bush — *As We May Think* (analyzed in [[Associative Indexing]])
- [ ] Tiago Forte — *Building a Second Brain*

Feeds directly into our system specs in [[Personal Knowledge Management]].

#reading #research #books`,
  },
  {
    id: 'note-coding-highlights',
    name: 'Coding Language Highlights.md',
    folderId: 'folder-systems',
    title: 'Coding Language Highlights',
    tags: ['code', 'languages', 'syntax', 'dev'],
    icon: 'Code2',
    iconColor: '#38bdf8',
    createdAt: Date.now() - 86400000 * 1,
    updatedAt: Date.now(),
    content: `---
title: "Coding Language Highlights"
tags: ["code", "languages", "syntax", "dev"]
date: "2026-09-04"
---
# Coding Language Syntax Highlights

The editor recognizes and provides syntax highlighting for major coding languages: **HTML**, **XML**, **PHP**, **JavaScript**, **Python**, and **SQL**.

## 1. JavaScript / TypeScript
\`\`\`javascript
// Asynchronous note indexing engine
async function indexVaultNotes(vaultId, options = {}) {
  const response = await fetch(\`/api/vault/\${vaultId}/query\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deepScan: true, ...options })
  });

  if (!response.ok) {
    throw new Error(\`Indexing failed with HTTP \${response.status}\`);
  }

  const { totalNotes, graphEdges } = await response.json();
  console.log(\`Indexed \${totalNotes} notes across \${graphEdges.length} edges\`);
  return { totalNotes, graphEdges };
}
\`\`\`

## 2. Python
\`\`\`python
# Vector similarity ranker for notes
from typing import List, Dict, Tuple
import math

class NoteSimilarityEngine:
    def __init__(self, threshold: float = 0.75):
        self.threshold = threshold
        self.registry: Dict[str, List[float]] = {}

    def compute_cosine_similarity(self, vec_a: List[float], vec_b: List[float]) -> float:
        dot_product = sum(a * b for a, b in zip(vec_a, vec_b))
        norm_a = math.sqrt(sum(a * a for a in vec_a))
        norm_b = math.sqrt(sum(b * b for b in vec_b))
        return dot_product / (norm_a * norm_b) if norm_a and norm_b else 0.0

    def find_nearest_neighbors(self, query_id: str, limit: int = 5) -> List[Tuple[str, float]]:
        target_vec = self.registry.get(query_id)
        if not target_vec:
            return []
        scores = [
            (nid, self.compute_cosine_similarity(target_vec, vec))
            for nid, vec in self.registry.items() if nid != query_id
        ]
        return sorted(scores, key=lambda x: x[1], reverse=True)[:limit]
\`\`\`

## 3. SQL
\`\`\`sql
-- Retrieve interrelated notes and backlink density
WITH RankedBacklinks AS (
  SELECT 
    target_note_id,
    COUNT(source_note_id) AS backlink_count,
    MAX(created_at) AS latest_link_time
  FROM note_edges
  WHERE is_reciprocal = TRUE
  GROUP BY target_note_id
)
SELECT 
  n.id,
  n.title,
  n.folder_id,
  COALESCE(rb.backlink_count, 0) AS total_backlinks,
  n.updated_at
FROM notes n
LEFT JOIN RankedBacklinks rb ON n.id = rb.target_note_id
WHERE n.is_archived = FALSE
ORDER BY total_backlinks DESC, n.updated_at DESC
LIMIT 20;
\`\`\`

## 4. HTML
\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Knowledge Vault Node</title>
  <link rel="stylesheet" href="/styles/cyber-vault.css">
</head>
<body class="dark-theme">
  <header id="vault-banner">
    <h1 class="node-title">Bidirectional Knowledge Topology</h1>
    <nav class="breadcrumb-trail">
      <a href="/systems">01 - Systems</a> / <span class="active-crumb">Core</span>
    </nav>
  </header>
  <main class="editor-stage">
    <div id="graph-stage" data-engine="force-directed"></div>
  </main>
</body>
</html>
\`\`\`

## 5. XML
\`\`\`xml
<?xml version="1.0" encoding="UTF-8"?>
<vault xmlns="https://schema.noteflow.org/v2" version="2.4">
  <metadata>
    <name>Cybernetic PKM</name>
    <author>Cyber Scholar</author>
    <encryption enabled="true" algorithm="AES-GCM-256"/>
  </metadata>
  <taxonomy>
    <category id="cat-01" label="Systems Architecture">
      <node id="node-01" type="atomic" title="Associative Graphing"/>
      <node id="node-02" type="hub" title="Bidirectional Linking"/>
    </category>
  </taxonomy>
</vault>
\`\`\`

## 6. PHP
\`\`\`php
<?php
namespace PKM\\Vault;

use Exception;
use DateTimeImmutable;

class MarkdownParser {
    private string $rawContent;
    private array $frontmatter = [];

    public function __construct(string $rawContent) {
        $this->rawContent = $rawContent;
        $this->extractFrontmatter();
    }

    private function extractFrontmatter(): void {
        if (preg_match('/^---\\r?\\n([\\s\\S]*?)\\r?\\n---/', $this->rawContent, $matches)) {
            $this->frontmatter = yaml_parse($matches[1]) ?: [];
        }
    }

    public function getTitle(): string {
        return $this->frontmatter['title'] ?? 'Untitled Note';
    }

    public function renderToHtml(): string {
        return htmlspecialchars($this->rawContent, ENT_QUOTES, 'UTF-8');
    }
}
?>
\`\`\`

Related notes: [[Personal Knowledge Management]] and [[Knowledge Engine 2026]].

#code #languages #syntax #dev`,
  },
  {
    id: 'note-knowledge-engine',
    name: 'Knowledge Engine 2026.md',
    folderId: 'folder-projects',
    title: 'Knowledge Engine 2026',
    tags: ['project', 'roadmap', 'pkm'],
    createdAt: Date.now() - 86400000 * 1,
    updatedAt: Date.now(),
    content: `---
title: "Knowledge Engine 2026"
tags: ["project", "roadmap", "pkm"]
date: "2026-09-03"
---
# Knowledge Engine 2026

An integrated digital workspace designed for continuous insight generation, structured around connected notes and dynamic graph visualizations.

## Roadmap & Milestone Checklist
- [x] Directory & recursive folder tree hierarchy
- [x] Full support for markdown notes with YAML frontmatter
- [x] Interactive bidirectional graph with force simulation ([[Graph Topology]])
- [x] Outgoing links & incoming backlinks context extractor ([[Bidirectional Linking]])
- [x] Split-pane and full-screen visualization modes
- [ ] Multi-vault synchronization

Direct link back to [[Personal Knowledge Management]].

#project #roadmap #pkm`,
  },
];
