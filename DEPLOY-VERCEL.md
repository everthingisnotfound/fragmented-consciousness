# Deploy Fragmented Consciousness on Vercel (Free)

Vercel **Hobby (free)** is the best fit for this project:

- Free HTTPS custom subdomain (`your-app.vercel.app`)
- Fast global CDN for the static Vite build
- Auto redeploy on every Git push
- No server to manage (the Express server is only for local `pnpm start`)

**Important:** This app uses **multiple browser popups** + **BroadcastChannel**. Deploy once, then open panes from your live URL — all windows must be the **same origin** (same `.vercel.app` domain).

---

## Option A — GitHub + Vercel Dashboard (recommended)

### Step 1: Put the project on GitHub

Open PowerShell in the project folder:

```powershell
cd "D:\coding folders\fragmented-consciousness-complete\fragmented-consciousness"

git init
git add .
git commit -m "Initial commit — Fragmented Consciousness"
```

Create a **new empty repo** on GitHub (no README), then:

```powershell
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/fragmented-consciousness.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

### Step 2: Import on Vercel

1. Go to [https://vercel.com](https://vercel.com) and sign up / log in (GitHub login is easiest).
2. Click **Add New… → Project**.
3. **Import** your `fragmented-consciousness` GitHub repo.
4. Vercel should auto-detect settings from `vercel.json`:

   | Setting            | Value           |
   |--------------------|-----------------|
   | Framework Preset   | Vite            |
   | Build Command      | `pnpm run build:web` |
   | Output Directory   | `dist/public`   |
   | Install Command    | `pnpm install`  |

5. Click **Deploy** (no environment variables required).
6. Wait ~1–2 minutes. You get a URL like `https://fragmented-consciousness-abc123.vercel.app`.

### Step 3: Use the live app

1. Open your Vercel URL.
2. Click **Open All Panes** (allow popups if the browser asks).
3. Move the mouse on the launcher or any pane — Body should chase.
4. For full behavior you need **6/6 panes** + **Vision** open.

Every `git push` to `main` triggers a new deployment automatically.

---

## Option B — Vercel CLI (no GitHub)

```powershell
cd "D:\coding folders\fragmented-consciousness-complete\fragmented-consciousness"
pnpm install
npx vercel login
npx vercel --prod
```

Follow prompts (link to your Vercel account, confirm project name). CLI uploads the project and deploys.

---

## Verify build locally first (optional)

```powershell
pnpm run build:web
pnpm preview
```

Open the preview URL and test **Open Body** before deploying.

---

## Free tier limits (Hobby)

- Unlimited static deployments for personal projects
- 100 GB bandwidth / month (more than enough for this demo)
- Serverless functions not used (static site only)

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Popups blocked | Allow popups for your `.vercel.app` domain in browser settings |
| Body shows 3/6 confused | Open **all six** panes from launcher |
| Humanoid is cyan placeholder | Add `client/public/models/cesium-man.glb` and redeploy |
| `pnpm` not found on Vercel | Ensure `packageManager` is set in `package.json` (already configured) |
| 404 on `/window/body` | Confirm `vercel.json` rewrites exist and redeploy |

---

## Custom domain (optional, still free on Vercel)

Vercel Dashboard → your project → **Settings → Domains** → add a domain you own and follow DNS instructions.
