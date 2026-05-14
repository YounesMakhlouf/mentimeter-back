# Real-Time Quiz App Backend

NestJS 11 (Express 5) + TypeORM (MySQL) + Passport (JWT) + Socket.IO backend for a Kahoot-style real-time quiz. The HTTP API handles auth and quiz CRUD; the WebSocket gateway drives live game sessions (join by PIN, broadcast questions, score answers, emit leaderboard).

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment variables](#environment-variables)
- [Running the application](#running-the-application)
- [Database & migrations](#database--migrations)
- [Architecture](#architecture)
- [Scripts](#scripts)

## Features

- Email/password registration + JWT login (`POST /authentication/register`, `POST /authentication/login`)
- Quiz CRUD with soft-delete; owner derived from the JWT
- Live game sessions over Socket.IO: create, join by 6-digit PIN, broadcast questions, score answers, emit leaderboard
- One-answer-per-player-per-question guard + host replay protection
- Swagger UI at `/document`

## Prerequisites

- Node.js `^20.19.0 || ^22.13.0 || >=24` (matches `engines.node`)
- npm 10+
- MySQL 8 reachable on `DATABASE_HOST:DATABASE_PORT`

## Installation

```bash
git clone https://github.com/YounesMakhlouf/mentimeter-back
cd mentimeter-back
npm install
```

## Environment variables

Copy `.env.example` to `.env` and fill in `SECRET` plus your local `DATABASE_*` values:

```bash
cp .env.example .env
```

Required keys (parsed and typed by `src/config/env.ts`; the app fails to boot on a missing or invalid value):

| Key | Notes |
| --- | --- |
| `APP_PORT` | HTTP port (e.g. `3000`) |
| `SECRET` | JWT signing key (`openssl rand -hex 32`) |
| `NODE_ENV` | `development` \| `production` \| `test`. `production` force-disables `DATABASE_SYNCHRONIZE` |
| `DATABASE_HOST` / `DATABASE_PORT` | MySQL host/port |
| `DATABASE_USERNAME` / `DATABASE_PASSWORD` / `DATABASE_NAME` | MySQL credentials |
| `DATABASE_SYNCHRONIZE` | `true` for dev-only entity auto-sync; keep `false` and use migrations |
| `CORS_ORIGINS` | Comma-separated allowlist. Empty = wildcard (warned in production) |

## Running the application

```bash
npm run start:dev   # watch mode; HTTP on port 3000, Socket.IO gateway on 3001
npm run build       # compile to dist/
npm run start:prod  # node dist/main
```

- Swagger UI: <http://localhost:3000/document>
- Socket.IO gateway: `ws://localhost:3001` (auth via `io(URL, { auth: { token } })`)

## Database & migrations

Schema changes go through TypeORM migrations. `synchronize` is off by default and is ignored entirely in production.

```bash
npm run migration:generate -- src/migrations/<Name>   # diff entities against the live DB
npm run migration:run                                 # apply pending migrations
npm run migration:revert                              # roll back the most recent
```

The CLI uses a standalone `src/data-source.ts`; the runtime connection is wired in `app.module.ts`. Migrations are **not** auto-applied at boot. production deploys must call `migration:run` explicitly.

## Architecture

### Network surfaces

- **Port 3000**: HTTP REST API. Global `ValidationPipe` (whitelist + transform), global `ClassSerializerInterceptor`, CORS allowlist from `CORS_ORIGINS`, request logger, Swagger at `/document`.
- **Port 3001**: `QuizSessionGateway` over Socket.IO. The live game loop.

### Domain model

`User 1 - N Quiz 1 - N Question 1 - N Option`. All entities use `@DeleteDateColumn` (soft delete). `Quiz.questions` and `Question.options` load eagerly; options cascade on save.

### Authentication

- `POST /authentication/register` and `POST /authentication/login`. Login returns `{ accessToken, username, email }`.
- All non-auth controllers are guarded by `JwtAuthGuard`. send `Authorization: Bearer <jwt>`.
- `POST /quizzes` derives the owner from the JWT via `@CurrentUser('email')`; a `userEmail` body field is ignored.
- WebSocket auth runs as a Socket.IO middleware in `afterInit` so `socket.data.user` is set before any message handler can fire. Missing token = anonymous (player flow). Invalid/expired token = rejected.

### Quiz session lifecycle (port 3001)

Sessions live in memory in `QuizSessionService.quizSessions`, keyed by a 6-digit numeric PIN (`crypto.randomInt`, collision-retry). Restarting the server drops all in-progress sessions.

1. Host emits `createQuizSession` with `{ quizId }`. Requires `socket.data.user`. Server replies with the PIN.
2. Players emit `joinQuiz` with `{ quizCode, playerName, avatar }` and land in the Socket.IO room named by the PIN.
3. Host emits `sendQuestion` with `{ quizCode, questionNumber }`. The handler stamps `currentQuestionNumber` / `currentQuestionStartTime`, clears `answeredForCurrent`, broadcasts `question` (with `totalQuestions`), and schedules the next event on `pendingTimer`. A host-initiated `sendQuestion` for the question already in progress is rejected so a double-click can't reset the timer or wipe the answer set. The internal timer-chain call passes no `client`, so host and replay checks are skipped.
4. Players emit `getAnswer` with `{ quizCode, answer, questionNumber }`. The player is identified by `socket.id`; duplicate or stale-question submissions are silently dropped. On scoring, the host receives `answerReceived` for the presenter live feed. `endQuiz` fires exactly once, from the timer.

## Scripts

| Script | Action |
| --- | --- |
| `npm run start:dev` | Watch-mode dev server (HTTP + WS) |
| `npm run build` | `nest build` → `dist/` |
| `npm run start:prod` | `node dist/main` |
| `npm run lint` | ESLint with `--fix` over `src/**/*.ts` |
| `npm run format` | Prettier over `src/` and `test/` |
| `npm test` | Jest unit tests (regex `*.spec.ts` under `src/`) |
| `npm run test:e2e` | Jest with `test/jest-e2e.json` |
| `npm run migration:*` | TypeORM CLI migration helpers |
