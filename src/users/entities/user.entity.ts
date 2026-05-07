import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Quiz } from "../../quizzes/entities/quiz.entity";

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  password?: string; // Remember to hash and salt this

  @OneToMany(
    ()=>Quiz,
    (quiz:Quiz)=>quiz.user
  )
  quizzes?:Quiz[]
}