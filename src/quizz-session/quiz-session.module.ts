import { Module } from "@nestjs/common";
import { QuizSessionService } from "./quiz-session.service";
import { QuizSessionGateway } from "./quiz-session.gateway";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Quiz } from "../quizzes/entities/quiz.entity";
import { User } from "../users/entities/user.entity";
import { AuthenticationModule } from "../authentication/authentication.module";

@Module({
  providers: [QuizSessionGateway, QuizSessionService],
  imports: [TypeOrmModule.forFeature([Quiz, User]), AuthenticationModule],
})
export class QuizSessionModule {}
