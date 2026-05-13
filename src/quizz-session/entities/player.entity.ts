// Plain in-memory record kept on QuizSession.players. Constructed via
// object literals in QuizSessionService.joinQuiz, not `new Player(...)`.
export class Player {
  pseudo: string;
  avatar: string;
  score: number;
  socketId: string;
}
