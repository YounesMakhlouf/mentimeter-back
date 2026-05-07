import {Injectable} from "@nestjs/common";
import {Quiz} from "./entities/quiz.entity";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {CrudService} from "../common/service/crud.service";
import {CreateQuizDto} from "./dto/create-quiz.dto";
import {User} from "../users/entities/user.entity";

@Injectable()
export class QuizzesService extends CrudService<Quiz> {
    constructor(
        @InjectRepository(Quiz) private quizRepository: Repository<Quiz>,
        @InjectRepository(User) private userRepository: Repository<User>,
    ) {
        super(quizRepository);
    }

    async saveQuiz(createQuizDto: CreateQuizDto, userEmail: string) {
        const user = await this.userRepository.findOne({where: {email: userEmail}});
        const quiz = this.quizRepository.create({
            name: createQuizDto.name,
            topic: createQuizDto.topic,
            questions: createQuizDto.questions,
            user,
        });
        return this.quizRepository.save(quiz);
    }
}