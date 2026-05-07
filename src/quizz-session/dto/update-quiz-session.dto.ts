import { PartialType } from "@nestjs/mapped-types";
import { CreateQuizSessionDto } from "./create-quiz-session.dto";
import { Quiz } from "../../quizzes/entities/quiz.entity";
import { Player } from "../entities/player.entity";

export class UpdateQuizSessionDto extends PartialType(CreateQuizSessionDto) {
  quiz?: Quiz;
  hasStarted?: boolean = false;
  players?: Player[];
}
