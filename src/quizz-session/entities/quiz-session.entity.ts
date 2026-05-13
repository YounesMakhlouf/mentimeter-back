import { User } from "../../users/entities/user.entity";
import { Quiz } from "../../quizzes/entities/quiz.entity";
import { Player } from "./player.entity";

// In-memory game state, keyed by quizCode in QuizSessionService.quizSessions.
// Constructed via an object literal in createQuiz — not `new QuizSession()`.
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
