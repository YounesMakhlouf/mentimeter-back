import { User } from "../../users/entities/user.entity";
import { Quiz } from "../../quizzes/entities/quiz.entity";
import { Player } from "./player.entity";

export class QuizSession {
  quiz: Quiz;
  quizCode: string;
  owner: User;
  ownerSocketId: string;
  players: Player[];
  currentQuestionNumber?: number;
  currentQuestionStartTime?: number;
  pendingTimer?: NodeJS.Timeout;
}
