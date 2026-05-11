import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Quiz } from "./entities/quiz.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CrudService } from "../common/service/crud.service";
import { CreateQuizDto } from "./dto/create-quiz.dto";
import { UpdateQuizDto } from "./dto/update-quiz.dto";
import { User } from "../users/entities/user.entity";

@Injectable()
export class QuizzesService extends CrudService<Quiz> {
  constructor(
    @InjectRepository(Quiz) private quizRepository: Repository<Quiz>,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {
    super(quizRepository);
  }

  async saveQuiz(createQuizDto: CreateQuizDto, userEmail: string) {
    const user = await this.userRepository.findOne({
      where: { email: userEmail },
    });
    const quiz = this.quizRepository.create({
      name: createQuizDto.name,
      topic: createQuizDto.topic,
      questions: createQuizDto.questions,
      user,
    });
    return this.quizRepository.save(quiz);
  }

  /** Update a quiz's name and/or topic. Only the quiz's owner can edit. */
  async updateQuiz(
    id: string,
    dto: UpdateQuizDto,
    userEmail: string,
  ): Promise<Quiz> {
    const quiz = await this.assertOwned(id, userEmail);
    if (dto.name !== undefined) quiz.name = dto.name;
    if (dto.topic !== undefined) quiz.topic = dto.topic;
    return this.quizRepository.save(quiz);
  }

  /** Soft-delete a quiz. Only the owner can delete. */
  async deleteQuiz(id: string, userEmail: string): Promise<void> {
    await this.assertOwned(id, userEmail);
    await this.quizRepository.softDelete(id);
  }

  private async assertOwned(id: string, userEmail: string): Promise<Quiz> {
    const quiz = await this.quizRepository.findOne({
      where: { id },
      relations: ["user"],
    });
    if (!quiz) throw new NotFoundException(`quiz ${id} not found`);
    if (quiz.user?.email !== userEmail) throw new ForbiddenException();
    return quiz;
  }
}
