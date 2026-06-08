# Overload

Overload is a fitness tracking and planning project with a completed Expo mobile app and a planned full-stack desktop companion. The mobile app handles fast workout and nutrition logging. The web app and Spring Boot API will focus on desktop workflows: analytics, program planning, progress review, exercise management, and AI-assisted training feedback.

## Current Repo

- `apps/mobile` - Expo Router, React Native, TypeScript mobile app. This is the current 1.0.0 baseline.
- `apps/web` - placeholder for the next React/Vite desktop companion phase.
- `services/api` - Spring Boot API with authentication, profile, fitness domain, nutrition, preset, program, and analytics routes.
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
```

Health checks:

```bash
curl http://localhost:8080/api/health
curl http://localhost:8080/actuator/health
```

Current API surface:

- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`
- `POST /api/pairing-codes`, `POST /api/auth/pairing-codes/claim`
- `GET /api/users/me`, `PATCH /api/users/me`
- `GET/POST /api/exercises`, `GET/PUT/DELETE /api/exercises/{id}`
- `GET/POST /api/workouts`, `GET/PATCH/DELETE /api/workouts/{id}`
- `GET/POST /api/nutrition/entries`, `PATCH/DELETE /api/nutrition/entries/{id}`
- `GET/PUT /api/nutrition/target`
- `GET/POST /api/presets/workouts`, `PATCH/DELETE /api/presets/workouts/{id}`
- `GET/POST /api/presets/meals`, `PATCH/DELETE /api/presets/meals/{id}`
- `GET/POST /api/programs`, `GET/PATCH/DELETE /api/programs/{id}`
- `GET /api/analytics/summary`

## Web Commands

Web scaffolding is the next phase. Once `apps/web` contains the Vite app, the intended local commands are:

```bash
cd apps/web
npm install
npm run dev
npm run build
```

Expected web environment variable:

```text
VITE_API_URL=http://localhost:8080/api
```

Open the web app with either `http://localhost:5173` or `http://127.0.0.1:5173`; both loopback origins are included in the backend's default CORS allowlist.

## Full-Stack Compose

`infra/docker-compose.yml` includes `api` and `web` services behind the `app` profile for later slices. The API service can run against local Postgres now; the web service becomes usable after `apps/web` is scaffolded.

```bash
docker compose -f infra/docker-compose.yml --profile app up --build
```

Until the web app exists, use Compose for PostgreSQL and optional API smoke testing only.

## Release Notes

See `docs/DEPLOYMENT.md` for the current mobile deployment checklist and local-first behavior.
