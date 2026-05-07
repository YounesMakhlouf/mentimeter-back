import { IsNotEmpty, IsUUID } from "class-validator";

export class CreateQuizSessionDto {
  @IsUUID()
  @IsNotEmpty()
  quizId: string;
}
