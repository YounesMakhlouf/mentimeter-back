import "reflect-metadata";
import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import { User } from "./users/entities/user.entity";
import { Question } from "./questions/entities/question.entity";
import { Quiz } from "./quizzes/entities/quiz.entity";
import { Option } from "./options/entities/option.entity";

dotenv.config();

// Standalone DataSource used by the TypeORM CLI for generating, running,
// and reverting migrations. The runtime connection lives in app.module.ts;
// this file exists only because the CLI needs a DataSource it can import.
export default new DataSource({
  type: "mysql",
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [User, Question, Quiz, Option],
  migrations: [__dirname + "/migrations/*.{ts,js}"],
  synchronize: false,
});
