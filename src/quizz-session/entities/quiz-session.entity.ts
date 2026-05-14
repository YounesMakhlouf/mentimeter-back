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
  // socket.ids that have submitted an answer for the current question.
  // Reset to a fresh Set each time sendQuestion advances. Lets getAnswer
  // silently drop duplicate submissions from the same socket.
  answeredForCurrent?: Set<string>;
  pendingTimer?: NodeJS.Timeout;
}
