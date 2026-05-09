import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./entities/user.entity";
import { CrudService } from "../common/service/crud.service";

@Injectable()
export class UsersService extends CrudService<User> {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super(userRepository);
  }

  getUserWithQuizzes(email: string) {
    return this.userRepository.findOne({
      where: { email },
      relations: ["quizzes"],
    });
  }
}
