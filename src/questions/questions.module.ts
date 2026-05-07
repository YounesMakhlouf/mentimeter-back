import { Module } from "@nestjs/common";
import { QuestionsService } from "./questions.service";
import { QuestionsController } from "./questions.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Question } from "./entities/question.entity";
import { Quiz } from "../quizzes/entities/quiz.entity";
import { Option } from "../options/entities/option.entity";

@Module({
  controllers: [QuestionsController],
  providers: [QuestionsService],
  imports: [TypeOrmModule.forFeature([Question, Quiz, Option])],
})
export class QuestionsModule {}
