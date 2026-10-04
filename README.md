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

## Screenshots
<img width="1868" height="954" alt="Screenshot_20261004_075758" src="https://github.com/user-attachments/assets/40204e71-fe6a-41b9-a570-e4e701895667" />
<img width="1868" height="954" alt="Screenshot_20261004_075709-1" src="https://github.com/user-attachments/assets/221b3845-42b1-41fb-a98a-4ea263d45765" />
<img width="1868" height="954" alt="Screenshot_20261004_075648" src="https://github.com/user-attachments/assets/de686d2d-b6a2-4b3e-b388-8949157b86db" />
<img width="1868" height="954" alt="Screenshot_20261004_075617-1" src="https://github.com/user-attachments/assets/574fe42d-1d05-4862-b863-e38648076baa" />
<img width="1865" height="955" alt="Screenshot_20261004_075538" src="https://github.com/user-attachments/assets/42c0058b-887a-4cf8-92b1-832a7105e7d2" />
<img width="1871" height="953" alt="Screenshot_20261004_075419-1" src="https://github.com/user-attachments/assets/3c98a696-0d11-4c00-81bd-1672cbf0ffb5" />
<img width="1868" height="955" alt="Screenshot_20261004_075327-1" src="https://github.com/user-attachments/assets/31f4cf01-133a-4c82-bb16-d74ac287250a" />

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
