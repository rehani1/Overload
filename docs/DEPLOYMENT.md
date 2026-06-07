# Overload 1.0.0 Deployment Checklist

## Mobile

1. Confirm release metadata in `apps/mobile/app.json`.
2. Configure `EXPO_PUBLIC_API_URL` only when the backend API is available.
3. Run checks from `apps/mobile` before building:

   ```bash
   npm run check
   ```

4. For web deployment, export the static web build:

   ```bash
   npx expo export --platform web
   ```

5. For native deployment, configure EAS for the target account and start a release build:

   ```bash
   npx eas build --platform ios
   npx eas build --platform android
   ```

## Local-First Mode

If `EXPO_PUBLIC_API_URL` is not set, the app stays in local-first mode using AsyncStorage. Auth records remain local to the device, while nutrition, workout history, active workout drafts, and presets are scoped per local account through `apps/mobile/src/lib/accountStorage.ts`.

Do not migrate old shared app-data keys into newly created accounts. The 1.0.0 local data isolation behavior is that new accounts start with empty app data unless the user creates entries under that account.

Protected routes are enforced in the root and route-group layouts. Logged-out users should be redirected away from tabs, settings, and workout routes, including web/deep-link entry.

## Backend

No backend service is required for the 1.0.0 mobile release. Treat `services/api` as a placeholder until Spring Boot application code and database migrations are added.
