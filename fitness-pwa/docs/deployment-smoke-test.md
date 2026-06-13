# Deployment Smoke Test Checklist

Use this checklist after deploying the Angular PWA to Vercel. Test with the production Vercel HTTPS URL, not only `localhost`.

## Basic App Load

- [ ] Open the Vercel URL.
- [ ] Confirm the app loads without a blank screen.
- [ ] Confirm the mobile shell/header/nav renders.
- [ ] Open browser DevTools Console and confirm there are no startup errors.

## Supabase Auth

- [ ] Confirm Supabase Auth **Site URL** points to the production Vercel URL.
- [ ] Confirm Supabase Auth redirect URLs include:
  - [ ] Production Vercel URL.
  - [ ] Custom domain, if one is attached.
  - [ ] `http://localhost:4200` for local development.
- [ ] Register with a non-allowlisted email and confirm access is blocked by Supabase/database rules.
- [ ] Register with an allowlisted email and confirm the expected Supabase Auth behavior.
- [ ] If email confirmation is enabled, confirm the email link returns to the deployed app.
- [ ] Log in with a valid account.
- [ ] Log out and confirm the session clears.

## Core Routes

- [ ] Dashboard loads after login.
- [ ] Refresh `/dashboard` directly and confirm it does not 404.
- [ ] Refresh `/templates` directly and confirm it does not 404.
- [ ] Refresh `/history` directly and confirm it does not 404.
- [ ] Open an invalid protected route while logged out and confirm the app redirects safely.

## Workout Templates

- [ ] Open Workout Templates from Dashboard.
- [ ] Create a basic template.
- [ ] Open the template editor.
- [ ] Add a block.
- [ ] Add an exercise to the block.
- [ ] Remove/reorder an item if needed.
- [ ] Duplicate a template.
- [ ] Delete a test template.

## Live Workout

- [ ] Start a workout from a template.
- [ ] Confirm the app navigates to `/workout/live/:sessionId`.
- [ ] Add a set with reps only.
- [ ] Add a set with weight only.
- [ ] Add a set with reps and weight.
- [ ] Add a notes-only set.
- [ ] Confirm saved sets appear immediately.
- [ ] Finish the workout.
- [ ] Confirm redirect to `/workout/summary/:sessionId`.
- [ ] Confirm the summary shows saved sets.

## Active Workout Resume

- [ ] Start a workout and leave it active.
- [ ] Navigate back to Dashboard.
- [ ] Confirm the Active Workout card/banner appears.
- [ ] Refresh the page.
- [ ] Confirm the Active Workout card/banner still appears.
- [ ] Tap Resume Workout.
- [ ] Confirm it opens the correct live workout on the first tap.
- [ ] Cancel the active workout and confirm the card/banner disappears.

## History

- [ ] Open Workout History.
- [ ] Confirm finished workouts appear.
- [ ] Refresh `/history` directly.
- [ ] Open a workout detail page.
- [ ] Refresh `/history/:sessionId` directly.
- [ ] Confirm exercises and sets render.
- [ ] Delete a test workout and confirm it disappears from history.
- [ ] Test Load More if more than 30 workouts exist.

## PWA Manifest and Service Worker

- [ ] Open DevTools > Application > Manifest.
- [ ] Confirm the manifest loads from `/manifest.webmanifest`.
- [ ] Confirm app name, short name, theme color, display mode, start URL, and icons appear.
- [ ] Open DevTools > Application > Service Workers.
- [ ] Confirm the Angular service worker registers.
- [ ] Confirm `/ngsw.json` loads.
- [ ] Reload the app and confirm it still starts normally.

## Add to Home Screen

Android Chrome:

- [ ] Open the production Vercel HTTPS URL.
- [ ] Use Chrome menu > Add to Home screen or Install app.
- [ ] Launch the installed app.
- [ ] Confirm it opens in standalone mode.
- [ ] Confirm login/session behavior still works.

iPhone Safari:

- [ ] Open the production Vercel HTTPS URL in Safari.
- [ ] Tap Share > Add to Home Screen.
- [ ] Launch the app from the home screen.
- [ ] Confirm it opens without obvious browser chrome.
- [ ] Confirm login/session behavior still works.

## Stale Build or Cache Problems

If the deployed app looks stale after a new deployment:

- [ ] Hard refresh the page.
- [ ] In Chrome DevTools, right-click Refresh and choose **Empty Cache and Hard Reload**.
- [ ] Go to DevTools > Application > Service Workers and click **Update**.
- [ ] If needed, click **Unregister** for the service worker, then reload.
- [ ] Go to DevTools > Application > Storage and use **Clear site data**.
- [ ] On iPhone, remove the Home Screen app and add it again.
- [ ] Confirm Vercel deployed the expected commit.

## Final Pass

- [ ] No console errors during the main flows.
- [ ] No network 404s for app chunks, manifest, icons, or service worker files.
- [ ] Direct route refresh works for protected app routes.
- [ ] Supabase data remains scoped to the logged-in user.
- [ ] The app is usable from a mobile viewport.
