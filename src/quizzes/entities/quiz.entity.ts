import {
  Column,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "../../users/entities/user.entity";
import { Question } from "../../questions/entities/question.entity";
import { Topic } from "../topics.enum";

@Entity()
export class Quiz {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @DeleteDateColumn()
  deletedAt: Date;

  @ManyToOne(() => User, (user: User) => user.quizzes)
  user: User;

  @OneToMany(() => Question, (question: Question) => question.quiz, {
    eager: true,
    cascade: true,
  })
  questions: Question[];

  @Column()
  topic: Topic;

  getId() {
    return this.id;
  }
}
