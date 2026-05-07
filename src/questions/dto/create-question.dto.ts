import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsNotEmpty, IsString, ValidateNested } from "class-validator";
import { CreateOptionDto } from "../../options/dto/create-option.dto";

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsString()
  @IsNotEmpty()
  correctAnswer: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOptionDto)
  @ArrayMinSize(2)
  @ArrayMaxSize(4)
  options: CreateOptionDto[];
}
