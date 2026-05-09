import { PartialType } from "@nestjs/mapped-types";
import { CreateQuizDto } from "./create-quiz.dto";
import { IsEnum } from "class-validator";
import { Topic, Topics } from "../topics.enum";

export class UpdateQuizDto extends PartialType(CreateQuizDto) {
  @IsEnum(Topics)
  topic?: Topic;
}
