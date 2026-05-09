import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { Question } from "./entities/question.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { CrudService } from "../common/service/crud.service";

@Injectable()
export class QuestionsService extends CrudService<Question> {
  constructor(
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
  ) {
    super(questionRepository);
  }

  /*async addQuestionWithOptions(question: Question): Promise<void> {
      this.questionRepository.create(question);
  }*/
}
