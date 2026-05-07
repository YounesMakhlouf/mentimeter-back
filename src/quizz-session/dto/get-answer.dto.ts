import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from "class-validator";

export class GetAnswerDto {
  @IsUUID()
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
