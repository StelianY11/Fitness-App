# PWA Setup

This app is configured as an Angular PWA so it can be installed later from an HTTPS deployment such as Vercel.

## Current PWA Pieces

- `public/manifest.webmanifest` defines the app name, short name, theme color, background color, standalone display mode, start URL, scope, portrait orientation, and app icons.
- `src/index.html` links the manifest and includes mobile meta tags for viewport, theme color, and iOS home screen behavior.
- `ngsw-config.json` configures Angular service worker asset caching.
- `angular.json` enables the service worker only for production builds.
- `src/app/app.config.ts` registers `ngsw-worker.js` when the app is not running in dev mode.

## How Install Works

Browsers use the web app manifest, service worker, icons, and HTTPS status to decide whether the app can be installed.

The app must be served over HTTPS in production. Vercel provides HTTPS automatically, which is why a Vercel deployment is the right place to test the real install flow.

## Android Install

On Chrome for Android:

1. Open the deployed HTTPS app.
2. Sign in if needed.
3. Open the browser menu.
4. Tap **Add to Home screen** or **Install app**.
5. Launch the app from the home screen.

Chrome may also show an install prompt automatically once it detects the manifest and service worker.

## iPhone Install

On Safari for iPhone:

1. Open the deployed HTTPS app in Safari.
2. Tap the Share button.
3. Tap **Add to Home Screen**.
4. Confirm the app name.
5. Launch the app from the home screen.

iOS support is more limited than Android. Safari uses the manifest and Apple-specific meta tags, but install prompts are manual.

## Local Testing Limits

`ng serve` is useful for development, but it does not fully represent production PWA behavior.

Important limitations:

- Angular service workers are enabled for production builds, not the normal development server.
- Installability checks are most reliable over HTTPS.
- Browser service worker caches can persist between test runs, so unregister old service workers in DevTools when behavior looks stale.
- iOS install behavior should be tested on a real device from the deployed HTTPS URL.

## Production Verification

Before testing install on Vercel:

1. Run `npm.cmd run build`.
2. Confirm `dist/fitness-pwa/browser/ngsw.json` exists.
3. Deploy to Vercel over HTTPS.
4. In Chrome DevTools Lighthouse or Application panel, verify:
   - Manifest loads.
   - Service worker registers.
   - Icons are found.
   - Display mode is `standalone`.
   - Start URL loads correctly.

## Notes

Do not store Supabase service role keys or other secrets in the PWA. Mobile-installed PWAs are still browser apps, so only public client configuration such as the Supabase anon key belongs in Angular environment files.
