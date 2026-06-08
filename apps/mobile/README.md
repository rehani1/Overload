# Overload Mobile

Overload is a local-first fitness logging app built with Expo Router, React Native, and TypeScript. Version `1.0.0` focuses on fast mobile workout logging, nutrition tracking, preset management, and optional API sync when a backend URL is intentionally configured.

## Features

- Local account registration and login with profile setup for current goal, default nutrition target, height, sex, and weight
- Account-scoped local persistence for nutrition, workouts, active workout drafts, and presets
- Protected app routes for tabs, settings, and workout screens to prevent logged-out deep-link access
- Manual workout logging with reusable workout editor flows
- Macro-based nutrition tracking with date-specific target history
- Workout and meal preset management from Profile
- Optional web pairing by code when `EXPO_PUBLIC_API_URL` is set
- Explicit local-data import confirmation before uploading existing AsyncStorage data

## Requirements

- Node.js 20 LTS or newer
- npm 10 or newer
- Expo Go, iOS Simulator, or Android Emulator

## Setup

```bash
npm install
cp .env.example .env
```

Set `EXPO_PUBLIC_API_URL` in `.env` only when a backend is available. If it is omitted, Overload runs in local-only mode using AsyncStorage.

When backend sync is configured, the settings screen shows web sync state and links to the pairing screen. Pairing stores an API auth session, then asks whether to import existing local nutrition, workouts, active workout draft, and presets. Choosing "Connect without import" leaves existing local data local.

## Development

```bash
npm start
npm run ios
npm run android
npm run web
```

## Quality Checks

```bash
npm run lint
npm run typecheck
npm run check
```

## Release Metadata

- App name: `Overload`
- App version: `1.0.0`
- iOS bundle identifier: `com.rehanislam.overload`
- Android package: `com.rehanislam.overload`
- Android version code: `1`

## Deployment Notes

The Expo app is configured for static web output and native builds through `app.json`. Use `EXPO_PUBLIC_API_URL` for backend-backed nutrition/workout sync only when intentionally testing API mode; otherwise the app remains fully usable with local persistence.
