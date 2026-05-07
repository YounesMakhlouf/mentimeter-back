import { ConnectedSocket, MessageBody, OnGatewayConnection, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { QuizSessionService } from "./quiz-session.service";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../users/entities/user.entity";
import { PayloadInterface } from "../authentication/Interfaces/payload.interface";

@WebSocketGateway(3001, { cors: { origin: "*" } })
export class QuizSessionGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly quizSessionService: QuizSessionService,
    private readonly jwtService: JwtService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {
  }

  async handleConnection(client: Socket): Promise<void> {
    const token = client.handshake?.auth?.token;
    if (typeof token !== "string" || token.length === 0) {
      // anonymous connection allowed (player join flow)
      return;
    }
    try {
      const payload = await this.jwtService.verifyAsync<PayloadInterface>(token, {
        secret: process.env.SECRET,
      });
      const user = await this.userRepository.findOneBy({ email: payload.email });
      if (!user) {
        client.disconnect();
        return;
      }
      delete user.password;
      client.data.user = user;
    } catch {
      client.disconnect();
    }
  }

    @SubscribeMessage('findAllQuizSession') handleFindAllQuizSession(@ConnectedSocket() client: Socket): any {
        const sessions = this.quizSessionService.findAll();
        const jsonResult = {};
        sessions.forEach((value, key) => {
            jsonResult[key] = value;
        });
        console.log(jsonResult)
        return client.emit('findAllQuizSession', jsonResult);
    }

    @SubscribeMessage('joinQuiz') handleJoinQuiz(@MessageBody() data: any, @ConnectedSocket() client: Socket): void {
        // we should save the quiz code in the front
        const {quizCode, playerName, avatar} = data;
        const result = this.quizSessionService.joinQuiz(quizCode, client.id, playerName, avatar);

        if (result) {
            client.join(quizCode);
            const quiz = this.quizSessionService.quizSessions.get(quizCode);
            console.log("player joined", quizCode)
            this.server.to(quiz.ownerSocketId).emit('playerJoined', {id: client.id, playerName, avatar});
            this.server.to(client.id).emit('playerJoined', {id: client.id, playerName, avatar});
        } else {
            client.emit('errorMsg', 'Failed to join quiz.');
        }
    }

  @SubscribeMessage("sendQuestion")
  sendQuestion(@MessageBody() data: any, @ConnectedSocket() client?: Socket): void {
    const { quizCode, questionNumber } = data;
    const quiz = this.quizSessionService.quizSessions.get(quizCode);
    if (!quiz) {
      this.server.to(quizCode).emit("error", `can't fetch quiz, it has probably been deleted`);
      return;
    }
    // host-only: client is undefined when invoked by the timer chain, which we trust
    if (client && client.id !== quiz.ownerSocketId) {
      client.emit("errorMsg", "only the session owner can advance questions");
      return;
    }

    const questions = quiz.quiz.questions;
    const question = questions[questionNumber];
    if (!question) {
      this.server.to(quizCode).emit("error", `an error occurred while retrieving question ${questionNumber}`);
      return;
    }

    this.quizSessionService.cancelPendingTimer(quizCode);
    quiz.currentQuestionNumber = questionNumber;
    quiz.currentQuestionStartTime = Date.now();

    this.server.to(quizCode).emit("question", { quizCode, question, questionNumber });

    const isLast = questionNumber + 1 >= questions.length;
    quiz.pendingTimer = setTimeout(() => {
      const stillAlive = this.quizSessionService.quizSessions.get(quizCode);
      if (!stillAlive) return;
      stillAlive.pendingTimer = undefined;
      if (isLast) {
        const resultArray = this.quizSessionService.processLeaderboard(quizCode);
        this.server.to(quizCode).emit("endQuiz", resultArray);
      } else {
        this.sendQuestion({ quizCode, questionNumber: questionNumber + 1 });
      }
    }, 10000);
  }

    sendLeaderboard(quizCode: string, leaderboard: any) {
        this.server.to(quizCode).emit("leaderboard", leaderboard);
    }

    @SubscribeMessage("createQuizSession")
    async handleCreateQuizSession(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
        const user = client.data.user as User | undefined;
        if (!user) {
            client.emit("errorMsg", "authentication required to create a quiz session");
            return;
        }
        const {quizId} = data;
        const session = await this.quizSessionService.createQuiz(quizId, user.email, client.id);
        client.emit("QuizCreationSuccess", session);
        return client.emit("createQuizSession", session);
    }

  /*   @SubscribeMessage("findOneQuizSession")
     handleFindOneQuizSession(@MessageBody() code: string, @ConnectedSocket() client: Socket): void {
         const session = this.quizSessionService.findOne(code, this.quizzes);
         client.emit("sessionDetail", session);
     }
 */
  getScore(validity: boolean, questionStartTime: number): number {
    const timeLeft = Math.max(0, 20 - ((Date.now() - questionStartTime) / 1000));
    return validity ? timeLeft * 10 : 0;
  }

  @SubscribeMessage("getAnswer")
  getAnswer(@MessageBody() data: any, @ConnectedSocket() client: Socket): void {
    const { quizCode, answer, questionNumber } = data;
    const quiz = this.quizSessionService.quizSessions.get(quizCode);
    if (!quiz) {
      client.emit("errorMsg", "quiz session not found");
      return;
    }
    const questions = quiz.quiz.questions;
    if (questionNumber < 0 || questionNumber >= questions.length) {
      client.emit("getQuestion", "invalid request , check question number");
      return;
    }
    if (questionNumber !== quiz.currentQuestionNumber || quiz.currentQuestionStartTime == null) {
      // answer arrived for a question that isn't the current one (late, replay, or out-of-order)
      return;
    }
    const question = questions[questionNumber];
    const player = quiz.players.find(p => p.socketId === client.id);
    if (!player) {
      client.emit("errorMsg", "player not found in this session");
      return;
    }
    player.score += this.getScore(answer === question.correctAnswer, quiz.currentQuestionStartTime);
  }

    endQuiz(quizCode: string, leaderboard: any): void {
        this.sendLeaderboard(quizCode, leaderboard);
    }
}
