# Noctua Forest — Curated Book Discovery Platform

This repository contains the public website for Noctua Forest, a curated book discovery platform with Google Analytics integration.

Audience: Authors across all genres seeking engaged readers and readers who value thoughtful storytelling. The platform facilitates manuscript submissions, quality curation, and author-reader connections.

Website structure
- `welcome.html`: landing page with CTAs to The Forest and submission
- `forest.html`: book discovery community (The Forest)
- `submit.html`: book submission form with optional premium review
- `contributor.html`: contributor application form for writers and industry professionals
- `newsletter.html`: newsletter signup with redirect to forest
- `about.html`: mission, contact, imprint
- `styles.css`: typography and layout
- Assets: images, icons, logo

Tooling (production)
- Hosting: Google Cloud Run (containerized static site)
- CI/CD: Cloud Build trigger on push to `main` using `cloudbuild.yaml`
- Web server: Nginx with `nginx.conf` (serves `welcome.html` as index)
- Container: `Dockerfile`, `.dockerignore`, `.gcloudignore`

Operational notes
- Premium review service ($14.99) integrates with Stripe Payment Links for book submissions
- Newsletter, book submissions, and contributor applications save to Firebase Firestore collections
- Community features include book discovery, genre filtering, author submissions, and contributor applications
- Contributors can link Medium profiles and submit articles via document upload
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
- For partnerships, manuscript submissions, and platform questions, email support@noctuaforest.com