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
import { Quiz } from "../../quizzes/entities/quiz.entity";
import { Option } from "../../options/entities/option.entity";

@Entity()
export class Question {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  question: string;

  @Column()
  correctAnswer: string;

  @ManyToOne(() => Quiz, (quiz: Quiz) => quiz.questions)
  quiz: Quiz;

  @OneToMany(() => Option, (option: Option) => option.question, {
    cascade: true,
    eager: true,
  })
  options: Option[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
