# Deployment & Android Packaging

## Status: Planned (not started)

The app is still in development. This file documents the intended deployment and Android packaging strategy for when the app is ready.

---

## 1. Deploy Next.js App → Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

- Use the free tier (Hobby plan)
- Domain: `<project>.vercel.app` (no custom domain for now)
- Environment variables from `.env.local` must be added to Vercel dashboard:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (without `NEXT_PUBLIC_` prefix — server-side only)

### Caveats
- Supabase SSR cookies need `SameSite` and secure-domain configuration for Capacitor WebView
- Auth callbacks may need `@capacitor/browser` to open system browser
- Cookie handling differs in WebView vs browser

---

## 2. Install Capacitor

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init <app-name> <app-id>
npx cap add android
```

### Plugins needed

| Feature | Plugin |
|---------|--------|
| Camera | `@capacitor/camera` |
| Haptics | `@capacitor/haptics` |
| File downloads | `@capacitor/filesystem`, `@capacitor/share` |
| Auth (OAuth) | `@capacitor/browser` |
| Splash screen | `@capacitor/splash-screen` |
| Status bar | `@capacitor/status-bar` |

### Push notifications (future)

Requires Firebase project + `@capacitor/push-notifications`:
- Create Firebase project
- Download `google-services.json` → place in `android/app/`
- Enable Firebase Cloud Messaging
- Configure notification channels

---

## 3. Capacitor Configuration

Create `capacitor.config.ts`:

```ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.study.boardexamprep',
  appName: 'Board Exam Prep',
  webDir: 'dist',
  server: {
    url: 'https://<project>.vercel.app',  // deployed URL
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
    },
    StatusBar: {
      style: 'dark',
    },
  },
};

export default config;
```

**Mode:** Live URL — the WebView loads the deployed site. API routes, SSR auth, and server-side Supabase all work as-is.

### Alternative (not recommended for this project)
Static export (`next.config.ts` → `output: 'export'`) would break API routes and SSR auth. Only viable if all data flows through browser-side Supabase client with RLS.

---

## 4. CSS: Safe Areas

Add to `globals.css`:

```css
/* Capacitor safe areas */
.notch-padding {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

---

## 5. Build APK for Sideloading

```bash
# Sync Capacitor config
npx cap sync android

# Open Android Studio
npx cap open android

# In Android Studio:
#   Build → Build Bundle(s) / APK(s) → Build APK
#   APK at: android/app/build/outputs/apk/debug/
```

### For release APK (Play Store):
- Generate signed keystore
- `Build → Generate Signed Bundle / APK`
- Output: `.aab` (Play Store) or `.apk` (sideload)

---

## 6. App Updates

Options:
- **Manual:** Rebuild APK each update (simple, what we'll start with)
- **OTA:** `@capgo/capacitor-updater` for in-app updates without Play Store

---

## 7. Security Notes

- `SUPABASE_SERVICE_ROLE_KEY` stays server-side (never in WebView)
- WebView JavaScript injection disabled by default in Capacitor
- Auth sessions use Supabase cookies (same as browser)
- No Firebase needed unless push notifications are required later

---

## 8. Estimated App Size

- Capacitor shell: ~3-5MB
- Plugins add ~1-2MB
- Total: ~5-7MB APK
