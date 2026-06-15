# Vercel Deployment

This project is prepared for a Vercel-hosted Angular PWA deployment. Do not commit private secrets or Supabase service role keys to the repo.

## Connect GitHub to Vercel

1. Push the repository to GitHub.
2. In Vercel, choose **Add New Project**.
3. Import the GitHub repository.
4. Set the project root to the Angular app folder if Vercel asks for it:
   - `fitness-pwa`
5. Keep deployments connected to GitHub so future pushes can create preview and production deployments.

## Build Settings

Use these settings in Vercel:

- Framework preset: Angular, or Other if Vercel does not detect the app correctly.
- Build command: `npm run build`
- Output directory: `dist/fitness-pwa/browser`
- Install command: Vercel default is fine, or `npm install`.

The repository also includes `vercel.json` with the same build command and output directory.

## SPA Routing

Angular client routes need a fallback so direct refreshes do not 404.

The `vercel.json` rewrite sends all unmatched routes to:

```text
/index.csr.html
```

This supports direct URLs such as:

- `/dashboard`
- `/templates`
- `/templates/:id`
- `/workout/live/:sessionId`
- `/workout/summary/:sessionId`
- `/history`
- `/history/:sessionId`
- `/exercises/:exerciseId/history`

Static assets are still served from the build output before the rewrite fallback.

## Environment Variables

The Angular app reads Supabase browser client values from Angular environment files at build time.

For Vercel, add these Environment Variables in **Project Settings > Environment Variables**:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Use the Supabase project URL for `SUPABASE_URL`, for example:

```text
https://your-project-ref.supabase.co
```

Use the public anon/publishable key for `SUPABASE_ANON_KEY`.

The Supabase anon publishable key is allowed in the browser. Never add the Supabase service role key to Angular, Vercel public environment variables, or any frontend bundle.

Angular does not automatically read Vercel variables at runtime. The `prebuild` script runs:

```text
node tools/write-environment.mjs
```

That script writes `src/environments/environment.generated.ts` from `SUPABASE_URL` and `SUPABASE_ANON_KEY`, then the production Angular build uses that generated file.

If either variable is missing during a local build, the build can still complete with placeholders and the app will log a clear console error. On Vercel or CI, missing Supabase variables fail the build instead of deploying placeholders.

Expected safe build log lines:

```text
Supabase environment diagnostics:
- SUPABASE_URL exists: yes
- SUPABASE_ANON_KEY exists: yes
Wrote Angular production environment: .../src/environments/environment.generated.ts
```

If either value says `no`, check that the variable names are exactly:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Also confirm the variables are enabled for the environment you are deploying, such as **Production**, **Preview**, or both.

For local development, `ng serve` uses:

- `src/environments/environment.development.ts`

Keep real local values out of commits. If you temporarily edit local environment files for testing, do not commit those values.

## Supabase Redirect and Site URL

In Supabase Dashboard, configure Auth URLs after Vercel deployment:

1. Go to **Authentication > URL Configuration**.
2. Set **Site URL** to the production Vercel URL, for example:
   - `https://your-app.vercel.app`
3. Add redirect URLs for local and deployed testing:
   - `http://localhost:4200`
   - `https://your-app.vercel.app`
   - Any custom domain you attach later.

This is especially important for email confirmation and password recovery flows.

## PWA Notes

Vercel provides HTTPS, which is required for real PWA install behavior.

After deployment:

1. Open the deployed HTTPS URL.
2. Check Chrome DevTools **Application** panel.
3. Confirm the manifest loads.
4. Confirm the service worker registers.
5. Confirm `ngsw.json` and icons load.
6. Test Add to Home Screen on Android Chrome and iPhone Safari.

See `docs/pwa.md` for detailed install notes.

## Pre-Deployment Checks

Run these before pushing/deploying:

```powershell
npm.cmd test
npm.cmd run build
```

Expected production PWA files:

- `dist/fitness-pwa/browser/index.csr.html`
- `dist/fitness-pwa/browser/manifest.webmanifest`
- `dist/fitness-pwa/browser/ngsw.json`
- `dist/fitness-pwa/browser/ngsw-worker.js`
