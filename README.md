# CREATEBYMOH — Cinematic Motion Design Portfolio

Premium portfolio + lead-capture site for CREATEBYMOH, a cinematic motion-design studio
making 10–15s vertical ad campaigns for **Perfume & Fragrance**, **Streetwear** and
**Fine Jewelry** brands. Copy and structure follow the draft site at
createbymoh.netlify.app; all campaign media is pulled from Google Drive at build time.

## Pages

| Route | Purpose |
|---|---|
| `/` | Home — hero, stats, mixed Master Campaign Showcase, services, brief form |
| `/perfumes/` | Perfume niche page — only perfume videos + art-direction stills + fragrance brief form |
| `/streetwear/` | Streetwear niche page — only streetwear videos + stills + garment brief form |
| `/jewelry/` | Jewelry niche page — only jewelry videos + stills + jewelry brief form |
| `/how-we-work/` | Studio process (4 steps) |
| `/about/` | Meet the expert |

All pages share: mobile-first responsive layout (phone → laptop → desktop), dark
cinematic gold theme, TikTok-style native video preview modal, WhatsApp floating
button, free-mockup brief form (opens a pre-filled email to
`webwizardmarketingagency@gmail.com`).

## Media pipeline (Google Drive → optimized assets)

Campaign media lives in three public Drive folders
(Jewelry / Perfume / Streetwear). `scripts/sync_media.py`:

1. Lists every file in all three folders.
2. Downloads originals to a temp dir (never committed).
3. Encodes every video (incl. `.mov`) to muted H.264 MP4 (max 720px wide) + poster
   frame → `assets/media/<niche>/videos/`.
4. Converts every image to WebP (max 1400px, q80) → `assets/media/<niche>/images/`.
5. Writes `assets/manifest.json`, which the front-end renders into cards/galleries.

The step is idempotent — already-processed files are skipped on re-runs.

## Deploy on Netlify (recommended)

1. Netlify → **Add new site → Import an existing project → GitHub** → pick this repo.
2. Netlify reads `netlify.toml` automatically:
   - Build command: `bash scripts/build_site.sh`
   - Publish directory: `.`
3. On the **first deploy** the build downloads + processes all Drive media
   (~5–8 minutes, one-time). Later deploys reuse whatever is committed/cached.
4. After the first successful build you may commit `assets/media/` +
   `assets/manifest.json` into git to make future builds instant.

### Optional: GitHub Actions auto-sync

`ci/sync-media.yml` contains a ready-made workflow that syncs the Drive folders on
every push and commits the optimized media into the repo. Move it to
`.github/workflows/sync-media.yml` to enable (requires a token/App with the
**Workflows** permission).

## Structure

```
├── index.html                 # Home
├── perfumes/index.html        # Perfume niche page
├── streetwear/index.html      # Streetwear niche page
├── jewelry/index.html         # Jewelry niche page
├── how-we-work/index.html     # Process
├── about/index.html           # Meet the expert
├── assets/
│   ├── css/style.css          # Design system (mobile-first)
│   ├── js/data.js             # Brand copy + niche curation config
│   ├── js/main.js             # Rendering + interactions
│   ├── favicon.svg
│   ├── manifest.json          # (generated) media manifest
│   └── media/                 # (generated) optimized videos/images
├── scripts/
│   ├── sync_media.py          # Drive → optimized media pipeline
│   ├── build_site.sh          # Netlify build entrypoint
│   └── requirements.txt       # pillow
├── ci/sync-media.yml          # optional GitHub Actions workflow
└── netlify.toml
```

## Customization quick map

- Copy, stats, WhatsApp number, email, card titles → `assets/js/data.js`
- Colors / spacing / breakpoints (620px / 900px / 1000px) → `assets/css/style.css`
- Niche page hero text → each page's `<section class="page-hero">`
- Brief form fields → the `form[data-brief]` block on each page

© CREATEBYMOH. Campaign media remain © their respective brands.
