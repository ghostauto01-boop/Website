# One-time setup: activate the Drive media auto-sync (~2 minutes)

This adds **one file** through the GitHub website so GitHub can download all
71 campaign videos/images from your three Google Drive folders, optimize them
for the web, and commit them into this repo at `assets/media/` — permanently.
Your Netlify deploy will then be instant (no build-time downloading).

> Why manually? Arena's GitHub App connection can't push files into
> `.github/workflows/`, but **your account can**. You only need to do this once.

## Steps

1. Open the repo: **https://github.com/ghostauto01-boop/Website**
2. Switch to the branch **`arena/019f850c-website`** (dropdown near the top-left, currently showing `main` or your branch).
3. Click **Add file → Create new file**.
4. In the filename box, type exactly this path:
   ```
   .github/workflows/sync-media.yml
   ```
   (GitHub turns `/` into folders automatically.)
5. Open **`ci/sync-media.yml`** in this repo (same branch), click **Raw**, select **all** (Ctrl/Cmd+A), copy it.
6. Paste into the new file editor.
7. Scroll down → **Commit changes… → Commit directly to the `arena/019f850c-website` branch → Commit changes**.

## What happens next (automatic)

- Committing the file **immediately starts** a "Sync Drive media" run (see the **Actions** tab).
- In ~5–8 minutes it commits everything into `assets/media/` + `assets/manifest.json` with the message
  `chore(media): sync portfolio assets from Google Drive [skip ci]`.
- After that, simply tell the agent *"media sync done"* — it will pull and verify everything.
- Any future push to the branch re-checks Drive and adds anything new automatically.

Troubleshooting: if the Actions run shows red ❌, open it and look at the
**Sync media from Google Drive** step log — any files that failed are listed
there; a re-run (push another small commit) retries just them.
