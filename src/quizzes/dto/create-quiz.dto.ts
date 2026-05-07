import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsEnum, IsNotEmpty, IsString, ValidateNested } from "class-validator";
import { Topic, Topics } from "../topics.enum";
import { CreateQuestionDto } from "../../questions/dto/create-question.dto";

export class CreateQuizDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(Topics)
  @IsNotEmpty()
  topic: Topic;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  @ArrayMinSize(1)
  questions: CreateQuestionDto[];
}
