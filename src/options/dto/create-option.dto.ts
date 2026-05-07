import { IsBoolean, IsNotEmpty, IsString } from "class-validator";

export class CreateOptionDto {
  @IsString()
  @IsNotEmpty()
  label: string;

  @IsBoolean()
  isCorrect: boolean;
}
