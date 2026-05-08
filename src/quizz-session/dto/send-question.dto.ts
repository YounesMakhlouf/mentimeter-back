import { IsInt, IsNotEmpty, Matches, Min } from "class-validator";

export class SendQuestionDto {
  @Matches(/^\d{6}$/, { message: "quizCode must be a 6-digit PIN" })
  @IsNotEmpty()
  quizCode: string;

  @IsInt()
  @Min(0)
  questionNumber: number;
}
