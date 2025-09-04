# Noctua Forest – Smarter Search (MVP) Guide

This guide explains how our smarter discovery engine works, how to tune it, and how to evolve it.

## 1) What shipped (Phase 1 MVP)

- Hierarchical tags + `semanticText` per book (title, author, blurb, tags, language, region)
- Lightweight intent parser (audience, tone, pace, domain, goal) using curated keyword lists
- Two rerankers:
  - Simple reranker (phrase + token overlap + tag overlap + popularity + recency)
  - Hybrid reranker (Universal Sentence Encoder cosine + tag overlap + popularity)
- Auto-switch logic: catalogs < 30 books use the simple reranker; larger catalogs use hybrid (with fallback to simple if the model fails to load)
- Runtime‑tunable weights via `window.FOREST_WEIGHTS`

Files: `forest-discovery.js` (no server changes required)

## 2) How it ranks

1. Fetch N books from Firestore (filters + sort)
2. If a search query exists, build facets via the intent parser
3. Rerank client-side:
   - Simple (small catalogs): weights `{ phrase: 0.45, tokens: 0.25, overlap: 0.15, popularity: 0.10, recency: 0.05 }`
   - Hybrid (larger catalogs): weights `{ cosine: 0.60, tagOverlap: 0.20, popularity: 0.20 }` (configurable)
4. Show “Why” chips when a query is present (up to 3 facets)

## 3) Tune weights (no deploy)

Add this near the bottom of `forest.html` (or any page that uses the engine) before loading `forest-discovery.js`:

```html
<script>
  window.FOREST_WEIGHTS = {
    // Hybrid reranker weights
    cosine: 0.70,
    tagOverlap: 0.15,
    popularity: 0.15
  };
</script>
```

Notes:
- If you provide only some fields, the rest fall back to defaults.
- For simple reranker weights, we currently keep constants in code. If you want live tuning for the simple mode too, see the Admin Config section below.

## 4) Admin-configured weights (optional upgrade)

We can make weights editable in the Admin dashboard and read them from Firestore so changes take effect instantly without deploys.

Suggested document:

- Collection: `settings`
- Doc ID: `searchWeights`
- JSON:

```json
{
  "mode": "hybrid",
  "cosine": 0.60,
  "tagOverlap": 0.20,
  "popularity": 0.20,
  "phrase": 0.45,
  "tokens": 0.25,
  "overlap": 0.15,
  "popularitySimple": 0.10,
  "recency": 0.05,
  "updatedAt": "<serverTimestamp>"
}
```

Client load pattern (pseudo):

```js
const snap = await getDoc(doc(db, 'settings', 'searchWeights'));
if (snap.exists()) {
  window.FOREST_WEIGHTS = { ...snap.data() };
}
```

Access control: gate the editor UI with Firebase custom claims (`admin: true`).

## 5) Intent parser – what it sees

- Extracts facets via curated dictionaries: `audience`, `tone`, `pace`, `domain`, `goal`
- Examples it can identify today: “for beginners”, “technical”, “fast”, “health/medicine/nutrition”, “learn/revise/relax”
- Parser is intentionally small; extend by adding keywords → zero code changes elsewhere

## 6) Why chips (UX)

- When a query is present, cards show up to three facet chips (e.g., `for beginners`, `technical`, `fast`)
- Chips are purely explanatory; they do not affect ranking beyond the parser

## 7) Performance

- Hybrid reranker lazily loads TFJS + USE once per session, caches embeddings, and falls back to simple mode if loading fails or catalog is small
- Everything runs in the browser; no server costs

## 8) Troubleshooting

- “Results look unchanged”: ensure a query is present; reranking triggers only for searches
- “Slow on first search”: first-time USE model load can take a moment; subsequent queries are fast
- “Weights not applied”: verify your `window.FOREST_WEIGHTS` script tag appears before `forest-discovery.js` and is not blocked by CSP
- “No Why chips”: chips show only when a query is present and at least one facet matched

## 9) Roadmap alignment (Phase 2+)

- Topic modeling job (LDA or similar) to generate tags automatically and enrich `semanticText`
- Feedback loop (clicks/saves) for manual weight tuning, then simple learning‑to‑rank
- Optional admin UI for live editing of intent dictionaries and weights
- Later: knowledge-graph MVP (authors/series/relations) to diversify and connect results

## 10) Quick checklist

- [ ] Add optional `window.FOREST_WEIGHTS` in `forest.html` to tune hybrid weights
- [ ] (Optional) Add Firestore doc `settings/searchWeights` and an admin editor UI
- [ ] Extend intent dictionaries as new user phrases emerge
- [ ] Review “Why” chips wording for tone and localization

Questions or tuning requests? Weights can be updated at runtime without a deploy.
