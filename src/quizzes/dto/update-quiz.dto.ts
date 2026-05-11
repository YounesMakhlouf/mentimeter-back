import { PickType, PartialType } from "@nestjs/swagger";
import { CreateQuizDto } from "./create-quiz.dto";

export class UpdateQuizDto extends PartialType(
  PickType(CreateQuizDto, ["name", "topic"] as const),
) {}
