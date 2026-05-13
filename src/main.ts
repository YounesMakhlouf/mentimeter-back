import "reflect-metadata";
import { NestFactory, Reflector } from "@nestjs/core";
import { AppModule } from "./app.module";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import {
  ClassSerializerInterceptor,
  Logger,
  ValidationPipe,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EnvConfig } from "./config/env";
import { Request, Response, NextFunction } from "express";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<EnvConfig, true>);

  // CORS: explicit allowlist via env. If unset (or empty), open in dev,
  // logged warning in prod so misconfiguration surfaces.
  const origins = config.get("CORS_ORIGINS", { infer: true });
  if (origins.length > 0) {
    app.enableCors({ origin: origins });
  } else {
    if (config.get("NODE_ENV", { infer: true }) === "production") {
      Logger.warn(
        "CORS_ORIGINS is empty in production — every origin can call the API.",
        "Bootstrap",
      );
    }
    app.enableCors();
  }

  // Request log: method, path, status, duration. Fires on response 'finish'.
  const httpLogger = new Logger("HTTP");
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on("finish", () => {
      httpLogger.log(
        `${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`,
      );
    });
    next();
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Let providers receive onApplicationShutdown / onModuleDestroy on SIGTERM,
  // so in-flight work can drain instead of being killed mid-flight.
  app.enableShutdownHooks();

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Mentimeter API")
    .setDescription("Quiz creation, live sessions, and authentication.")
    .setVersion("1.0")
    .addBearerAuth(
      { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      "bearer",
    )
    .addTag("authentication", "Register, login")
    .addTag("users", "Read-only user lookup")
    .addTag("quizzes", "Create / list / fetch / update / delete quizzes")
    .addTag("questions", "Quiz questions")
    .addTag("options", "Question options")
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("document", app, document);

  await app.listen(config.get("APP_PORT", { infer: true }));
}

bootstrap();
