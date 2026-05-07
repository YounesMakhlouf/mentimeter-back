# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run start:dev` — run the HTTP server on port 3000 with watch mode (also boots the WebSocket gateways on 3001 and 3002).
- `npm run build` / `npm run start:prod` — production build / run from `dist/main`.
- `npm run lint` — ESLint with `--fix` over `src`, `apps`, `libs`, `test`.
- `npm run format` — Prettier over `src` and `test`.
- `npm test` — Jest unit tests; root is `src`, regex `*.spec.ts`. Single test: `npx jest src/path/to/file.spec.ts` or `npx jest -t "<test name>"`.
- `npm run test:e2e` — uses `test/jest-e2e.json`.
- Swagger docs: http://localhost:3000/document (only the `AuthenticationModule` is included in the OpenAPI spec — see `main.ts`).

## Required environment

`.env` is loaded by `dotenv` in `main.ts` and `app.module.ts`. Required keys:
`APP_PORT`, `SECRET` (JWT signing), `DATABASE_TYPE`, `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `DATABASE_NAME`, `DATABASE_SYNCHRONIZE`. The DB driver is hardcoded to `mysql` in `app.module.ts` regardless of `DATABASE_TYPE`. With `DATABASE_SYNCHRONIZE=true`, TypeORM auto-syncs schema from entities — there are no migrations.

## Architecture

NestJS 10 + TypeORM (MySQL) + Passport (JWT + Google OAuth) + dual WebSocket transports.

### Three network surfaces, three ports
- **Port 3000** — HTTP REST API (Express). Global `ValidationPipe`, CORS open, Swagger at `/document`.
- **Port 3001** — `QuizSessionGateway` (Socket.IO, `cors: { origin: "*" }`). The live game loop: create/join sessions, broadcast questions, collect answers, emit leaderboard.
- **Port 3002** — `UserAnswerGateway` (raw `ws` via `@nestjs/platform-ws` registered in `main.ts` as `WsAdapter`). Note the protocol mismatch: the Socket.IO client cannot speak to this gateway. Most flows go through port 3001.

### Domain model (TypeORM)
`User 1—N Quiz 1—N Question 1—N Option`. Plus `UserAnswer`. Entities use `@DeleteDateColumn` (soft delete) and load relations eagerly: `Quiz.questions` (eager), `Question.options` (eager + cascade). When fetching a Quiz to run a session, `QuizSessionService.createQuiz` still uses an explicit `leftJoinAndSelect` query — preserve that pattern when changing the session creation flow.

### Quiz session lifecycle (port 3001)
`QuizSession` instances are kept **in memory** in `QuizSessionService.quizSessions: Map<string, QuizSession>` keyed by a UUID `quizCode`. There is no persistence for sessions, players, or scores — restarting the server loses all live game state.

Gateway flow (`src/quizz-session/quiz-session.gateway.ts`):
1. Host (authenticated) emits `createQuizSession` with `{quizId}` → server stores session, replies with `quizCode`. Owner email is taken from the connection JWT, not the message body.
2. Players (anonymous OK) emit `joinQuiz` with `{quizCode, playerName, avatar}` → joins the Socket.IO room `quizCode`; the player record stores their `socket.id`.
3. Host emits `sendQuestion` with `{quizCode, questionNumber}`. The handler stamps `currentQuestionNumber` and `currentQuestionStartTime` on the session, broadcasts `question`, and schedules the next event (next question or `endQuiz`) on a `pendingTimer` stored on the session. The recursive timer call passes no client, so the host check is skipped for trusted internal calls. Calling `sendQuestion` again or `cancelPendingTimer(quizCode)` clears the chain — use the latter on session removal so timers don't fire into a dead room.
4. Players emit `getAnswer` with `{quizCode, answer, questionNumber}`. The player is identified by `socket.id` (not by a body field) and scored against `quiz.currentQuestionStartTime`. Answers for stale `questionNumber`s are silently dropped. `endQuiz` fires exactly once, from the timer.

### Authentication
- `AuthenticationModule` registers `JwtStrategy` and `GoogleStrategy` and `exports: [JwtModule]` so other modules (e.g. `QuizSessionModule`) can inject `JwtService`. JWT secret comes from `process.env.SECRET` (sign and verify both read it). The standalone `jwt-constants.ts` at the repo root is now unused dead code — safe to delete.
- Routes: `POST /authentication/register`, `POST /authentication/login`, `GET /authentication/google/login` (browser redirect), `GET /authentication/success` (Google callback → returns JWT).
- Login/Google login response shape: `{ accessToken, username, email }`. Note the field is `accessToken` (camelCase) — historically it was `access-token`.
- All non-auth controllers (`/users`, `/quizzes`, `/options`, `/questions`) are guarded by `@UseGuards(JwtAuthGuard)` at the controller level — clients must send `Authorization: Bearer <jwt>`. `POST /quizzes` derives the owner email from the JWT via `@CurrentUser('email')` (param decorator at `src/authentication/decorators/current-user.decorator.ts`); a `userEmail` body field is ignored.
- WebSocket auth on port 3001: `QuizSessionGateway` implements `OnGatewayConnection`. Token is read from `handshake.auth.token` (Socket.IO clients pass it as `io(URL, { auth: { token } })`). Missing token = anonymous (the player join flow); valid token = the user is loaded onto `socket.data.user`; invalid/expired token = the server disconnects. `createQuizSession` requires `socket.data.user`. `sendQuestion` requires `client.id === session.ownerSocketId`. The `findAllQuizSession` handler is **still unauthenticated** and exposes every live session — known issue.

### Module wiring quirks
- `AppModule` lists `OptionsModule` and `QuestionsModule` twice in `imports` (harmless but intentional-looking — leave as-is unless cleaning up).
- `CommonModule` is `@Global()` but currently exports nothing.
- `app.module.ts` calls `dotenv.config()` and `authentication.module.ts` does so again — both are needed because the JWT module reads `process.env.SECRET` at import time.
- `QuizSessionModule` imports `AuthenticationModule` so the gateway can inject `JwtService` for connection-time token verification.

## Conventions
- Path style: relative imports throughout (no `@/` alias configured), except a few `src/...` absolute imports in gateways — both work.
- ESLint disables `no-explicit-any` and return-type rules, and `any` is used liberally in gateway message bodies. DTOs exist under each module's `dto/` for HTTP routes, but WebSocket payloads are not validated.
