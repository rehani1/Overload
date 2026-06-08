# Overload Web

Desktop companion app for Overload, built with Vite, React, TypeScript, Tailwind, React Router, TanStack Query, and Axios.

## Features

- Authenticated app shell with guarded routes
- Login/register with backend token handling and refresh
- Dashboard with analytics, today's nutrition, recent activity, library counts, and meaningful workout-volume trends when enough completed workout dates exist
- Workouts, nutrition, presets, profile, and AI chat pages
- Mobile pairing dialog for web-generated sync codes
- Backend-proxied OpenAI chat so secrets never enter the browser bundle

## Local Development

```bash
npm install
npm run dev
```

Set the API base URL when it differs from the default:

```text
VITE_API_URL=http://localhost:8080/api
```

Do not put OpenAI keys in `apps/web/.env`. The AI page calls `POST /api/ai/chat`; set `OPENAI_API_KEY` in `services/api/.env` instead.

## Routes

- `/login`
- `/register`
- `/`
- `/workouts`
- `/nutrition`
- `/presets`
- `/profile`
- `/ai`

## Checks

```bash
npm run check
npm run build
```
