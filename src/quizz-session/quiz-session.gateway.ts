import { ConnectedSocket, MessageBody, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException, WsResponse } from "@nestjs/websockets";
import { ClassSerializerInterceptor, UseInterceptors, UsePipes, ValidationPipe } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { QuizSessionService } from "./quiz-session.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../users/entities/user.entity";
import { PayloadInterface } from "../authentication/Interfaces/payload.interface";
import { CreateQuizSessionDto } from "./dto/create-quiz-session.dto";
import { JoinQuizDto } from "./dto/join-quiz.dto";
import { SendQuestionDto } from "./dto/send-question.dto";
import { GetAnswerDto } from "./dto/get-answer.dto";

const QUESTION_DURATION_MS = 10_000;

@WebSocketGateway(3001, { cors: { origin: "*" } })
@UseInterceptors(ClassSerializerInterceptor)
@UsePipes(new ValidationPipe({
  whitelist: true,
  transform: true,
  exceptionFactory: (errors) => new WsException(errors),
}))
export class QuizSessionGateway implements OnGatewayInit, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly quizSessionService: QuizSessionService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {
  }

  handleDisconnect(client: Socket): void {
    for (const [code, session] of this.quizSessionService.quizSessions) {
      if (session.ownerSocketId === client.id) {
        this.server.to(code).emit("sessionEnded", { reason: "host disconnected" });
        this.quizSessionService.remove(code);
      }
    }
  }

  afterInit(server: Server): void {
    // Auth runs during the handshake so socket.data.user is set before any
    // message handler can fire. Async handleConnection would race with
    // immediate-emit-on-connect clients.
    server.use(async (socket, next) => {
      const token = socket.handshake?.auth?.token;
      if (typeof token !== "string" || token.length === 0) {
        return next(); // anonymous connection allowed (player join flow)
      }
      try {
        const payload = await this.jwtService.verifyAsync<PayloadInterface>(token, {
          secret: this.config.get<string>('SECRET'),
        });
        const user = await this.userRepository.findOneBy({ email: payload.email });
        if (!user) return next(new Error("unauthorized"));
        socket.data.user = user;
        next();
      } catch {
        next(new Error("unauthorized"));
      }
    });
  }

    @SubscribeMessage('findAllQuizSession')
    handleFindAllQuizSession(@ConnectedSocket() client: Socket): WsResponse | void {
        const user = client.data.user as User | undefined;
        if (!user) {
            client.emit('errorMsg', 'authentication required');
            return;
        }
        const data: Record<string, unknown> = {};
        this.quizSessionService.findAll().forEach((session, code) => {
            if (session.owner?.email === user.email) {
                // pendingTimer is a NodeJS.Timeout (non-serializable); strip it.
                const { pendingTimer: _t, ...rest } = session;
                data[code] = rest;
            }
        });
        return { event: 'findAllQuizSession', data };
    }

    @SubscribeMessage('joinQuiz') handleJoinQuiz(@MessageBody() data: JoinQuizDto, @ConnectedSocket() client: Socket): void {
        const {quizCode, playerName, avatar} = data;
        const result = this.quizSessionService.joinQuiz(quizCode, client.id, playerName, avatar);

        if (result) {
            client.join(quizCode);
            const quiz = this.quizSessionService.quizSessions.get(quizCode);
            this.server.to(quiz.ownerSocketId).emit('playerJoined', {id: client.id, playerName, avatar});
            this.server.to(client.id).emit('playerJoined', {id: client.id, playerName, avatar});
        } else {
            client.emit('errorMsg', 'Failed to join quiz.');
        }
    }

  @SubscribeMessage("sendQuestion")
  sendQuestion(@MessageBody() data: SendQuestionDto, @ConnectedSocket() client?: Socket): void {
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
        this.quizSessionService.remove(quizCode);
      } else {
        this.sendQuestion({ quizCode, questionNumber: questionNumber + 1 });
      }
    }, QUESTION_DURATION_MS);
  }

    sendLeaderboard(quizCode: string, leaderboard: any) {
        this.server.to(quizCode).emit("leaderboard", leaderboard);
    }

    @SubscribeMessage("createQuizSession")
    async handleCreateQuizSession(@MessageBody() data: CreateQuizSessionDto, @ConnectedSocket() client: Socket) {
        const user = client.data.user as User | undefined;
        if (!user) {
            client.emit("errorMsg", "authentication required to create a quiz session");
            return;
        }
        const session = await this.quizSessionService.createQuiz(data.quizId, user.email, client.id);
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
    const timeLeftMs = Math.max(0, QUESTION_DURATION_MS - (Date.now() - questionStartTime));
    return validity ? (timeLeftMs / 1000) * 10 : 0;
  }

  @SubscribeMessage("getAnswer")
  getAnswer(@MessageBody() data: GetAnswerDto, @ConnectedSocket() client: Socket): void {
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
