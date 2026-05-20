# StayMatch AI — CLAUDE.md

Read this file at the start of every session. It is the single source of truth for what we are building, how we build it, and what is explicitly out of scope.

---

## What we're building

An agentic hospitality matchmaker for the Build with AI Tirana hackathon (May 20-22, 2026).
Users describe how they want to travel in natural language. A Gemini-powered agent uses
function calling to search a property database and analyze guest reviews, then returns
ranked matches with verbatim review quotes.

**Demo is 3 minutes on stage at Piramida, Tirana. Final pitch: Friday May 22, ~3 PM.**
**Judging criteria: technical execution, agentic depth, Albanian/local impact, demo polish.**

---

## Hackathon constraints

- ~18-20 hours of total build time across 3 people.
- DO NOT add features outside the demo path. If a feature won't appear in the 3-minute pitch, skip it.

---

## Tech stack (locked — do not deviate without asking)

| Layer | Choice |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript strict, Tailwind CSS |
| Backend | Next.js API routes — no separate server |
| AI | Gemini 2.5 Flash via `@google/genai` SDK |
| Embeddings | `text-embedding-004` (latest Gemini embedding model) |
| Vector store | In-memory cosine similarity over a JSON file of pre-embedded reviews. **No pgvector, no Pinecone, no vector DB.** |
| Hosting | Google Cloud Run, Dockerfile at root, single-container Next.js standalone build |
| Auth | None. Public URL. |
| Env vars | `GOOGLE_API_KEY` |

---

## Architecture — three-agent pipeline

```
User query (natural language)
        │
        ▼
┌─────────────────────┐
│  Interpreter Agent  │  Parses query → structured filters + semantic intent
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│    Search Agent     │  Runs vector search + Gemini function calling
│                     │  Tools: fetchProperties, analyzePropertyReviews
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  Synthesis Agent    │  Generates personalized match explanations
│                     │  with verbatim review quotes
└─────────────────────┘
```

### Gemini tools (function calling)

- `fetchProperties(location, maxPrice, partySize)` → filtered candidate list
- `analyzePropertyReviews(propertyId, criteria)` → match strength + supporting quotes

---

## The demo MUST show (non-negotiable)

1. Natural language input box at the top.
2. **Live Execution Visualizer** (right panel) — shows each tool call, match strength, property accepts/rejects in real time as the agent works. Powered by SSE.
3. Final property cards with: name, photo placeholder, Vibe Match %, 2-3 verbatim review quotes that justify the match.
4. Three pre-loaded demo query buttons (digital nomad, family in Saranda, one weird/funny one).

---

## Directory structure (target)

```
/
├── CLAUDE.md
├── Dockerfile
├── next.config.ts
├── package.json
├── tsconfig.json
├── data/
│   ├── properties.json       # { id, name, location, basePrice, sleeps, lat, lng, photoUrl, description }
│   ├── reviews.json          # { propertyId, author, date, text, source }
│   └── embeddings.json       # pre-computed: { propertyId, reviewIndex, vector[] }
├── lib/
│   ├── gemini.ts             # shared Gemini client wrapper — ALL tool calls go through here
│   ├── eventStream.ts        # in-memory event emitter → SSE feed for the Visualizer
│   ├── embeddings.ts         # load embeddings, cosine similarity, top-k retrieval
│   ├── tools/
│   │   ├── fetchProperties.ts
│   │   ├── analyzePropertyReviews.ts
│   │   └── index.ts          # exports Gemini-compatible function declarations + implementations
│   └── agents/
│       ├── interpreter.ts
│       ├── search.ts
│       ├── synthesis.ts
│       └── orchestrator.ts   # takes user query → runs all three agents → streams events
├── app/
│   ├── layout.tsx
│   ├── page.tsx              # main UI: input box + visualizer + results
│   └── api/
│       ├── agent/
│       │   └── route.ts      # POST /api/agent — starts agent run, returns runId
│       └── agent/stream/
│           └── route.ts      # GET /api/agent/stream?runId=X — SSE endpoint
└── components/
    ├── SearchInput.tsx
    ├── ExecutionVisualizer.tsx
    ├── PropertyCard.tsx
    └── DemoQueryButtons.tsx
```

---

## Code rules (enforced every session)

- TypeScript strict mode. **No `any` types.**
- All Gemini tool calls go through `lib/gemini.ts` (the shared client wrapper) — never call the SDK directly from agent files.
- All tool call activity emits events to `lib/eventStream.ts` → consumed by the SSE route → rendered by `<ExecutionVisualizer />`.
- Stream UI updates via **SSE**, not polling.
- Files must stay **under 200 lines**. Split when they grow.
- No comments explaining what the code does. Only add a comment when the WHY is non-obvious.

---

## Data files

- `data/properties.json` — ~15 properties in Albania (Tirana, Saranda, Berat, etc.)
- `data/reviews.json` — ~200 reviews seeded by Kristi
- `data/embeddings.json` — pre-computed at build time by a one-off script (`scripts/embed.ts`)

---

## Out of scope — do not build, do not suggest

- User accounts / auth
- Real booking or payment integration
- Mobile responsiveness (we demo on a projector)
- Maps
- More than 15 properties
- Real Booking.com / Airbnb API integration
- Tests (no time — this is a hackathon)
- Any feature that does not appear in the 3-minute demo

---

## Team

| Person | Role |
|---|---|
| Aldi | Architecture, Gemini integration, pitch |
| Anest | Frontend, UI polish, deployment |
| Kristi | Dataset, query testing, time-keeping |

---

## Session workflow guide

### Use `/plan` before any non-trivial change

Don't say "build the embedding pipeline." Say:

> `/plan` Build the embedding pipeline. Read CLAUDE.md first. Then outline: what files you'll create, what functions go in each, how the data flows from `reviews.json` → `embeddings.json` → query-time cosine similarity. Don't write code yet — just the plan.

Review the plan. Push back. Then say "OK execute that plan."

### One feature per session (target build order)

| Session | Deliverable |
|---|---|
| 1 | Data layer — JSON shapes + `scripts/embed.ts` (pre-compute embeddings) |
| 2 | Search layer — query → embedding → top-k cosine retrieval |
| 3 | Agent layer — Gemini function-calling wired to the search tool |
| 4 | Synthesis layer — final Gemini call producing Vibe Match % + quote explanations |
| 5 | Next.js API route gluing it together (`/api/agent` + `/api/agent/stream`) |
| 6 | Frontend: input box + property result cards |
| 7 | **Live Execution Visualizer** — the wow piece, give this its own session |
| 8 | Dockerfile + Cloud Run deployment |
| 9 | Pre-loaded demo query buttons + visual polish |

### Give Claude the error, not the symptom

Paste the exact error message and failing command. Not "the deploy isn't working" — paste the `gcloud run deploy` output.

### Lock working state before any risky change

```bash
git add . && git commit -m "working state before X"
```

---

## Live Execution Visualizer — spec

Component: `<ExecutionVisualizer />`. Subscribes to SSE at `/api/agent/stream`.
Renders a vertical timeline. Each event is one of:

| Event type | Visual |
|---|---|
| `agent_thinking` | Italic text, fading dot |
| `tool_call_start` | Tool icon, parameters shown, in-progress spinner |
| `tool_call_result` | Collapsible result, success or rejection badge |
| `property_accepted` | Green flash, property name |
| `property_rejected` | Red strikethrough, one-line reason |
| `final_ranking` | Sparkle animation, total count |

Animations: Framer Motion, 200ms slide-in from right per event card.
Color palette: dark mode — black background, off-white text, electric blue accent.
