# INKredible Tools — Second Brain UI

Mobile-first Next.js app for searching OpenClaw memories across:

- Daily memory notes
- Brain dump transcripts
- Conversation logs
- Extracted documents

## Stack

- Next.js + TypeScript
- Tailwind CSS
- Fuse.js (client-side fuzzy search)
- Static JSON in `public/data`
- GitHub Pages deployment via GitHub Actions

## Design Targets

- Origin Financial-style light UI
- Background: `#F7F8FA`
- Typography: Plus Jakarta Sans (headings), Inter (body)
- Mobile viewport optimization: `900–1000px` (Samsung Z-Fold class)

## Local Development

```bash
npm install
npm run dev
```

App runs at `http://localhost:3000`.

## Refresh Memory Data

Regenerate JSON from workspace memory/transcript/extraction files:

```bash
npm run generate:data
```

Outputs are written to `public/data/*.json`.

## Build for GitHub Pages

```bash
npm run build
```

Static output is exported to `out/` with `.nojekyll`.

## GitHub Pages Deployment

Deployment is automated via `.github/workflows/deploy.yml` on push to `main`.

### Repo setup checklist

1. Create repo: `Shadowwall44/inkredible-tools`
2. Push this project to `main`
3. In GitHub repo settings:
   - **Pages → Build and deployment → Source: GitHub Actions**
4. Push updates to redeploy

The deployed URL should be:

`https://shadowwall44.github.io/inkredible-tools/`
