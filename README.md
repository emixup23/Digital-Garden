# 🌱 Digital Garden

A personal knowledge management system built around plain Markdown notes. Organize notes in directories, tag them, link them with `[[wiki-links]]`, and explore how they connect through an interactive bidirectional graph.

## Features

- **Directory organization**: notes live in folders, so your structure stays yours
- **Markdown notes**: every note is a plain `.md` file, with syntax-highlighted code blocks
- **Tag indexing**: browse and filter notes by tag
- **Wiki-linking**: connect notes with `[[note-name]]` links
- **Bidirectional graph**: visualize outgoing links and backlinks as an interactive graph (D3)
- **Installable PWA**: works like an app on desktop and mobile
- **Gemini integration**: AI features powered by the Gemini API <!-- TODO: say what it does, e.g. summaries, tag suggestions, link suggestions -->

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | React 19, TypeScript, Vite 6 |
| Styling | Tailwind CSS 4 |
| Graph | D3 |
| Animation / icons | Motion, Lucide |
| Backend | Express |
| AI | Google Gemini (`@google/genai`) |
| Tooling | Bun (lockfile), tsx, esbuild, vite-plugin-pwa |

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+ or [Bun](https://bun.sh/)
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/)

### Installation

```bash
git clone https://github.com/emixup23/Digital-Garden.git
cd Digital-Garden
npm install        # or: npm install
```

### Configuration

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Required for Gemini API calls |
| `APP_URL` | URL where the app is hosted (self-referential links, callbacks, API endpoints) |

> Never commit your `.env` file. It is already listed in `.gitignore`.

### Run

```bash
npm run dev 
```

The dev server starts on <http://localhost:3000>.

## Scripts

| Command | Description |
|---|---|
| `dev` | Start the Vite dev server on port 3000 |
| `build` | Create a production build |
| `preview` | Preview the production build locally |
| `lint` | Type-check with `tsc --noEmit` |
| `clean` | Remove `dist` and `server.js` |

## Project structure

```
Digital-Garden/
├── public/          # Static assets
├── scripts/         # Helper scripts
├── src/             # Application source
├── index.html       # App entry point
├── metadata.json    # App metadata
├── vite.config.ts   # Vite configuration
└── .env.example     # Environment variable template
```

## Writing notes

Notes are Markdown files. Link to another note with double brackets:

```markdown
# My note

Related to [[another-note]].

#tag-one #tag-two
```

<!-- TODO: confirm the real tag syntax (inline #tags or YAML frontmatter) and wiki-link resolution rules -->

## Roadmap

- [ ] Bidirectional sync with [TaskFlow](https://github.com/emixup23/TaskFlow) (tasks mapped to notes, API key auth)

## Contributing

Issues and pull requests are welcome. For larger changes, please open an issue first to discuss what you would like to change.

## License

<!-- TODO: add a LICENSE file (MIT is a common choice) and name it here -->

## Acknowledgements

Bootstrapped from the [Google AI Studio repository template](https://github.com/google-gemini/aistudio-repository-template).
