# Minimal Author Site

A bare-bones, static, two-page website for selling books and an about page.

- books.html: Books list with buy/preview links (site entry)
- about.html: Short bio and contact
- styles.css: Simple modern styling

How to use
- Open `books.html` in your browser
- Edit text, links, and author name directly in the HTML

Deploy options
- Google Cloud Run (recommended): use Cloud Build trigger on push to `main`
- Netlify/Vercel: drag-and-drop the folder
- Any static host: upload the files

Notes
- No build tools, frameworks, or dependencies
- Replace placeholder links and copy

Scripts (Windows)
- `scripts\serve.bat`: start a local server on http://localhost:8080 and open Books

Cloud Run deployment
- Files added: `Dockerfile`, `nginx.conf`, `cloudbuild.yaml`, `.gcloudignore`.
- Setup once:
  - Create an Artifact Registry repo (name matches `_REPO` in `cloudbuild.yaml`, default `web`).
  - Create a Cloud Build trigger for this repo on pushes to `main`, with substitutions:
    - `_SERVICE=noctua-forest`, `_REGION=us-central1`, `_REPO=web`
  - Enable Cloud Run, Cloud Build, Artifact Registry APIs.
- Deploy: push to `main` to build+deploy automatically.

Stub pages
- `checkout.html`: placeholder for future payment flow; currently shows a disabled button and link back to Books. Replace with your cart/checkout integration.
- `newsletter.html`: placeholder for mailing list. Swap the stub form with your provider embed (e.g., Mailchimp/ConvertKit).
- `account.html`: placeholder for authentication. Replace with your auth provider (e.g., Firebase/Auth0/Clerk) when ready.
