import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { QuizzesModule } from "./quizzes/quizzes.module";
import { UsersModule } from "./users/users.module";
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";
import { User } from "./users/entities/user.entity";
import { Question } from "./questions/entities/question.entity";
import { Quiz } from "./quizzes/entities/quiz.entity";
import { Option } from "./options/entities/option.entity";
import { AuthenticationModule } from "./authentication/authentication.module";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { QuizSessionModule } from "./quizz-session/quiz-session.module";
import { EnvConfig, loadEnv } from "./config/env";

@Module({
  imports: [
    UsersModule,
    QuizzesModule,
    ConfigModule.forRoot({ isGlobal: true, validate: loadEnv }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (
        config: ConfigService<EnvConfig, true>,
      ): TypeOrmModuleOptions => ({
        type: "mysql",
        host: config.get("DATABASE_HOST", { infer: true }),
        port: config.get("DATABASE_PORT", { infer: true }),
        username: config.get("DATABASE_USERNAME", { infer: true }),
        password: config.get("DATABASE_PASSWORD", { infer: true }),
        database: config.get("DATABASE_NAME", { infer: true }),
        entities: [User, Question, Quiz, Option],
        // Schema sync is dev-only. Production must use migrations to avoid
        // accidental column/data drops.
        synchronize:
          config.get("NODE_ENV", { infer: true }) !== "production" &&
          config.get("DATABASE_SYNCHRONIZE", { infer: true }),
        migrations: [__dirname + "/migrations/*.{ts,js}"],
      }),
      inject: [ConfigService],
    }),
    AuthenticationModule,
    QuizSessionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
