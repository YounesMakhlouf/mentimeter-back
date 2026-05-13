import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { randomInt } from "crypto";
import { QuizSession } from "./entities/quiz-session.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Quiz } from "../quizzes/entities/quiz.entity";
import { Repository } from "typeorm";
import { User } from "../users/entities/user.entity";

const QUIZ_CODE_LENGTH = 6;
const QUIZ_CODE_MAX_ATTEMPTS = 100;

@Injectable()
export class QuizSessionService {
  quizSessions: Map<string, QuizSession> = new Map();
  constructor(
    @InjectRepository(Quiz) private quizRepository: Repository<Quiz>,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  /**
   * Generates a 6-digit numeric PIN that isn't currently in use.
   * Uses crypto.randomInt for unbiased generation; retries on collision.
   */
  private generateQuizCode(): string {
    for (let attempt = 0; attempt < QUIZ_CODE_MAX_ATTEMPTS; attempt++) {
      const code = randomInt(0, 1_000_000)
        .toString()
        .padStart(QUIZ_CODE_LENGTH, "0");
      if (!this.quizSessions.has(code)) return code;
    }
    throw new InternalServerErrorException(
      "could not allocate a unique quiz code; too many active sessions",
    );
  }

  async createQuiz(
    quizId: string,
    ownerId: string,
    ownerSocketId: string,
  ): Promise<string> {
    const quizCode = this.generateQuizCode();
    const quiz = await this.quizRepository
      .createQueryBuilder("quiz")
      .where("quiz.id = :id", { id: quizId })
      .leftJoinAndSelect("quiz.questions", "question")
      .leftJoinAndSelect("question.options", "option")
      .getOne();
    const owner = await this.userRepository.findOne({
      where: { email: ownerId },
    });
    const quizSession: QuizSession = {
      quiz,
      quizCode,
      owner,
      ownerSocketId,
      players: [],
    };
    this.quizSessions.set(quizCode, quizSession);
    return quizCode;
  }

  joinQuiz(
    quizCode: string,
    socketId: string,
    playerName: string,
    avatar: string,
  ): boolean {
    const quiz = this.quizSessions.get(quizCode);
    if (!quiz) return false;
    if (quiz.players.some((p) => p.socketId === socketId)) return false;
    quiz.players.push({
      pseudo: playerName,
      avatar,
      score: 0,
      socketId,
    });
    return true;
  }

  processLeaderboard(quizCode: string) {
    const quizSession = this.quizSessions.get(quizCode);
    if (quizSession) {
      const leaderboard = quizSession.players
        .sort((a, b) => b.score - a.score)
        .map((player, index) => ({
          rank: index + 1,
          name: player.pseudo,
          score: player.score,
          avatar: player.avatar,
        }));
      return leaderboard;
    }
  }

  findAll(): Map<string, QuizSession> {
    return this.quizSessions;
  }

  findOne(code: string): QuizSession {
    const session = this.quizSessions.get(code);
    if (!session)
      throw new NotFoundException(`Quiz session with code ${code} not found`);
    return session;
  }

  cancelPendingTimer(code: string): void {
    const session = this.quizSessions.get(code);
    if (session?.pendingTimer) {
      clearTimeout(session.pendingTimer);
      session.pendingTimer = undefined;
    }
  }

  remove(code: string) {
    this.cancelPendingTimer(code);
    if (!this.quizSessions.delete(code)) {
      throw new NotFoundException(`Quiz session with code ${code} not found`);
    }
  }
}
