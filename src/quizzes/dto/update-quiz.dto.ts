import { PickType, PartialType } from "@nestjs/swagger";
import { CreateQuizDto } from "./create-quiz.dto";

// Only name + topic are editable in this iteration. Replacing the
// nested `questions` array on an existing quiz requires explicit
// orphan handling (the old questions / options stay in the DB
// otherwise); that's a separate change.
export class UpdateQuizDto extends PartialType(
  PickType(CreateQuizDto, ["name", "topic"] as const),
) {}
