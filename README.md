# Noctua Forest — Authentic Book Discovery

Noctua Forest helps readers discover books through authentic, community‑written reviews. The mission is simple: make it easy to find the right book for the moment—by mood, pace, and purpose—without hype.

- For readers: explore “The Forest” feed, search semantically, and follow themes that feel natural.
- For curators: write concise, real reviews; organize them into shareable lists; earn commissions as your recommendations help others.

Website structure
- `welcome.html`: landing page with CTAs to The Forest and submission
- `forest.html`: book discovery community (The Forest)
- `reviews.html`: book review submission form with reading verification
- `contributor.html`: contributor application form for writers and industry professionals
- `newsletter.html`: newsletter signup with redirect to forest
- `about.html`: mission, contact, imprint
- `styles.css`: typography and layout
- Assets: images, icons, logo

Search (MVP)
- Lightweight intent parser (audience, tone, pace, domain, goal)
- Client‑side reranking: simple scorer for small catalogs; hybrid cosine+signals for larger
- Runtime‑tunable weights via `window.FOREST_WEIGHTS` (see `SEMANTIC-SEARCH-GUIDE.md`)

Tooling (production)
- Hosting: Google Cloud Run (containerized static site)
- CI/CD: Cloud Build trigger on push to `main` using `cloudbuild.yaml`
- Web server: Nginx with `nginx.conf` (serves `welcome.html` as index)
- Container: `Dockerfile`, `.dockerignore`, `.gcloudignore`

Operational notes
- Reviews are free and publish immediately; moderation is reactive
- Lists are shareable and stream‑ready (QR codes). Curator Plus adds analytics and theming
- Firestore stores books, reviews, and lists; client renders cards and insights per book
- Accessibility: semantic headings, high‑contrast palette, responsive images, mobile optimization

Local preview
- Windows: `scripts\serve.bat` starts a local server at http://localhost:8080 and opens Welcome page.

Deployment
1. Ensure Cloud Run, Cloud Build, and Artifact Registry are enabled.
2. Create an Artifact Registry repo (matches `_REPO` in `cloudbuild.yaml`).
3. Create a Cloud Build trigger for branch `main` and set substitutions:
   - `_SERVICE=noctua-forest`, `_REGION=us-central1`, `_REPO=<your-repo>`
4. Push to `main` → Cloud Build builds and deploys to Cloud Run.

Contact
- For questions and partnerships: support@noctuaforest.com
- Guides: `SEMANTIC-SEARCH-GUIDE.md` for search tuning