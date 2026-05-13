import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "../../users/entities/user.entity";
import { Question } from "../../questions/entities/question.entity";
import { Topic, Topics } from "../topics.enum";

@Entity()
export class Quiz {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ type: "enum", enum: Object.values(Topics) })
  topic: Topic;

  @ManyToOne(() => User, (user: User) => user.quizzes)
  user: User;

  @OneToMany(() => Question, (question: Question) => question.quiz, {
    eager: true,
    cascade: true,
  })
  questions: Question[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
