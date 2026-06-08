# Overload

Overload is a fitness tracking and planning project with a completed Expo mobile app, a Spring Boot API, and a desktop web companion. The mobile app handles fast workout and nutrition logging. The web app complements mobile with analytics, review, presets, profile data, mobile pairing, and AI-assisted training chat.

## Current Repo

- `apps/mobile` - Expo Router, React Native, TypeScript mobile app. This is the current 1.0.0 baseline.
- `apps/web` - Vite, React, TypeScript, Tailwind desktop app with authenticated routes and API-backed dashboards.
- `services/api` - Spring Boot API with authentication, profile, fitness domain, nutrition, preset, program, analytics, mobile import, pairing, and AI chat routes.
- `infra` - local infrastructure, including Docker Compose for PostgreSQL.
- `docs` - deployment and release notes.

## Requirements

- Node.js 20 LTS or newer
- npm 10 or newer
- Docker Desktop or Docker Engine with Docker Compose v2
- Java 21 for backend work

## Local Setup

Start local PostgreSQL:

```bash
docker compose -f infra/docker-compose.yml up -d postgres
```

The default local database settings are:

```text
Database: overload
Username: overload
Password: overload
Port: 5432
JDBC URL: jdbc:postgresql://localhost:5432/overload
```

Stop local infrastructure:

```bash
docker compose -f infra/docker-compose.yml down
```

Remove local database data:

```bash
docker compose -f infra/docker-compose.yml down -v
```

## Mobile Commands

```bash
cd apps/mobile
npm install
npm start
npm run ios
npm run android
npm run web
npm run check
```

The mobile app remains local-first unless `EXPO_PUBLIC_API_URL` is set. Leave that variable unset unless backend API mode is being tested intentionally.

## Backend Commands

The backend is a Spring Boot 3.x API with a Maven wrapper, PostgreSQL, Flyway, Spring Security, Validation, JPA, and Actuator.

```bash
cd services/api
cp .env.example .env
./mvnw spring-boot:run
./mvnw test
```

Expected backend environment variables:

```text
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/overload
SPRING_DATASOURCE_USERNAME=overload
SPRING_DATASOURCE_PASSWORD=overload
JWT_SECRET=replace-with-a-long-random-secret
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:8081,http://127.0.0.1:8081
OPENAI_API_KEY=optional-for-web-ai-chat
OPENAI_MODEL=gpt-5.4-mini
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MAX_OUTPUT_TOKENS=600
```

For local OpenAI chat, copy `services/api/.env.example` to `services/api/.env` and set `OPENAI_API_KEY`. The real `.env` file is gitignored and the web app calls the backend proxy, so the key is not exposed through Vite.

Health checks:

```bash
curl http://localhost:8080/api/health
curl http://localhost:8080/actuator/health
```

Current API surface:

- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`
- `POST /api/pairing-codes`, `POST /api/auth/pairing-codes`, `POST /api/auth/pairing-codes/claim`
- `POST /api/import/mobile`
- `GET /api/users/me`, `PATCH /api/users/me`
- `GET/POST /api/exercises`, `GET/PUT/DELETE /api/exercises/{id}`
- `GET/POST /api/workouts`, `GET/PATCH/DELETE /api/workouts/{id}`
- `GET/POST /api/nutrition/entries`, `PATCH/DELETE /api/nutrition/entries/{id}`
- `GET/PUT /api/nutrition/target`
- `GET/POST /api/presets/workouts`, `PATCH/DELETE /api/presets/workouts/{id}`
- `GET/POST /api/presets/meals`, `PATCH/DELETE /api/presets/meals/{id}`
- `GET/POST /api/programs`, `GET/PATCH/DELETE /api/programs/{id}`
- `GET /api/analytics/summary`
- `POST /api/ai/chat`

## Web Commands

The web app is the authenticated desktop companion workspace.

```bash
cd apps/web
npm install
npm run dev
npm run check
npm run build
```

Expected web environment variable:

```text
VITE_API_URL=http://localhost:8080/api
```

Open the web app with either `http://localhost:5173` or `http://127.0.0.1:5173`; both loopback origins are included in the backend's default CORS allowlist.

Current web pages:

- Dashboard: analytics, today's nutrition, recent activity, library snapshot, and meaningful muscle-group volume trends when enough workout dates exist.
- Workouts: readable workout history with exercise and set detail.
- Nutrition: target and logged entry review.
- Presets: workout and meal presets. Desktop UI uses "Presets"; "Programs" redirects here for compatibility.
- Profile: account and mobile profile data such as goal, height, weight, sex, and preferred unit.
- AI: authenticated chat UI backed by `/api/ai/chat`.

AI chat requires `OPENAI_API_KEY` in `services/api/.env`; do not add OpenAI secrets to `apps/web/.env`.

## Full-Stack Compose

`infra/docker-compose.yml` includes `api` and `web` services behind the `app` profile for full-stack local runs. For day-to-day work, running Postgres through Compose and starting API/web directly is usually faster.

```bash
docker compose -f infra/docker-compose.yml --profile app up --build
```

Use the direct API/web commands above when iterating on code.

## Release Notes

See `docs/DEPLOYMENT.md` for the current mobile deployment checklist and local-first behavior.
