import {
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  Min,
} from "class-validator";

export class GetAnswerDto {
  @Matches(/^\d{6}$/, { message: "quizCode must be a 6-digit PIN" })
  @IsNotEmpty()
  quizCode: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  answer: string;

  @IsInt()
  @Min(0)
  questionNumber: number;
}
