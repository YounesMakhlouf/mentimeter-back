import {
  Column,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Question } from "../../questions/entities/question.entity";

@Entity()
export class Option {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  label: string;

  @DeleteDateColumn()
  deletedAt: Date;

  @Column()
  isCorrect: boolean;
  @ManyToOne(() => Question, (question: Question) => question.options)
  question: Question;
}
