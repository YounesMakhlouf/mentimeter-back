import { IsNotEmpty, IsString, Matches, MaxLength } from "class-validator";

export class JoinQuizDto {
  @Matches(/^\d{6}$/, { message: "quizCode must be a 6-digit PIN" })
  @IsNotEmpty()
  quizCode: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  playerName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  avatar: string;
}
