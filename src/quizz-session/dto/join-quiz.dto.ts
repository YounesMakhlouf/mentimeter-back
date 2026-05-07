import { IsNotEmpty, IsString, IsUUID, MaxLength } from "class-validator";

export class JoinQuizDto {
  @IsUUID()
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
