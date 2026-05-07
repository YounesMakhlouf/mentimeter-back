import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./entities/user.entity";
import {CrudService} from "../common/service/crud.service";
import {Quiz} from "../quizzes/entities/quiz.entity";

const PUBLIC_USER_FIELDS = ['id', 'email'] as const;

@Injectable()
export class UsersService extends CrudService<User>{
  constructor(
    @InjectRepository(User)
    private userRepository : Repository<User>
  )
  {
    super(userRepository)
  }

  findAll(): Promise<User[]> {
    return this.userRepository.find({ select: [...PUBLIC_USER_FIELDS] });
  }

  findOne(id: string): Promise<User> {
    return this.userRepository.findOne({ where: { id }, select: [...PUBLIC_USER_FIELDS] });
  }

  getUserWithQuizzes(email:string){
    let user=this.userRepository.findOne({
      where: { email:email },
      relations: ['quizzes'],
    });
    return user;
  }
}
