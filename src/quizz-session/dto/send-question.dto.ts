import { IsInt, IsNotEmpty, IsUUID, Min } from "class-validator";

export class SendQuestionDto {
  @IsUUID()
  @IsNotEmpty()
  quizCode: string;

  @IsInt()
  @Min(0)
  questionNumber: number;
}
