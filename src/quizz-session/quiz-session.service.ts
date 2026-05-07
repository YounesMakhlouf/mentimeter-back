import {Injectable, NotFoundException} from '@nestjs/common';
import {CreateQuizSessionDto} from './dto/create-quiz-session.dto';
import {v4 as uuidv4} from 'uuid';
import {QuizSession} from "./entities/quiz-session.entity";
import {QuizzesService} from "../quizzes/quizzes.service";
import {InjectRepository} from "@nestjs/typeorm";
import {Quiz} from "../quizzes/entities/quiz.entity";
import {Repository} from "typeorm";
import {Question} from "../questions/entities/question.entity";
import {Option} from "../options/entities/option.entity";
import {User} from "../users/entities/user.entity";
import {UsersService} from "../users/users.service";

@Injectable()
export class QuizSessionService {

    quizSessions: Map<string, QuizSession> = new Map();
    constructor(@InjectRepository(Quiz) private quizRepository: Repository<Quiz>,
                @InjectRepository(User) private userRepository: Repository<User>) {
    }
    async createQuiz(quizId: string, ownerId: string, ownerSocketId: string): Promise<string> {
        const quizCode = uuidv4();
        const quiz = await this.quizRepository.createQueryBuilder('quiz')
            .where('quiz.id = :id', { id : quizId })
            .leftJoinAndSelect('quiz.questions', 'question')
            .leftJoinAndSelect('question.options', 'option')
            .getOne()
        const owner = await this.userRepository.findOne({where: {email: ownerId}});
        const quizSession: QuizSession = {
            quiz: quiz,
            quizCode: quizCode,
            owner: owner,
            hasStarted: false,
            players: [],
            ownerSocketId: ownerSocketId
        }
        this.quizSessions.set(quizCode, quizSession);
        return quizCode;
    }

    joinQuiz(quizCode: string, socketId: string, playerName: string, avatar: string): boolean {
        const quiz = this.quizSessions.get(quizCode);
        if (!quiz) return false;
        if (quiz.players.some(p => p.socketId === socketId)) return false;
        quiz.players.push({pseudo: playerName, avatar: avatar, answers: [], score: 0, socketId});
        return true;
    }

    startQuiz(quizCode: string): any[] {
        const quizSession: QuizSession = this.quizSessions.get(quizCode);
        const quiz = quizSession.quiz;
        if (quiz) {
            quizSession.hasStarted = true;
            return quiz.questions; // Send the questions to all players
        }
        throw new NotFoundException(`Quiz session with code ${quizCode} not found`);
    }

    processLeaderboard(quizCode: string) {
        const quizSession = this.quizSessions.get(quizCode);
        if (quizSession) {
            const leaderboard = quizSession.players
                .sort((a, b) => b.score - a.score)
                .map((player, index) => ({
                    rank: index + 1, name: player.pseudo, score: player.score, avatar: player.avatar
                }));
            return leaderboard;
        }
    }

    // processLeaderboard(quizCode: string) {
    //     const leaderboard = [{
    //         id: 1, name: "Eva Green", score: 225, avatar: "https://randomuser.me/api/portraits/women/24.jpg"
    //     }, {id: 2, name: "James Smith", score: 200, avatar: "https://randomuser.me/api/portraits/men/24.jpg"}, {
    //         id: 3, name: "Isabella Johnson", score: 250, avatar: "https://randomuser.me/api/portraits/women/25.jpg"
    //     }, {
    //         id: 4, name: "Ethan Williams", score: 195, avatar: "https://randomuser.me/api/portraits/men/25.jpg"
    //     }, {
    //         id: 5, name: "Sophia Brown", score: 180, avatar: "https://randomuser.me/api/portraits/women/26.jpg"
    //     }, {
    //         id: 6, name: "Daniel Davis", score: 210, avatar: "https://randomuser.me/api/portraits/men/26.jpg"
    //     }, {
    //         id: 7, name: "Olivia Garcia", score: 205, avatar: "https://randomuser.me/api/portraits/women/27.jpg"
    //     }, {
    //         id: 8, name: "Matthew Rodriguez", score: 175, avatar: "https://randomuser.me/api/portraits/men/27.jpg"
    //     }, {
    //         id: 9, name: "Ava Martinez", score: 230, avatar: "https://randomuser.me/api/portraits/women/28.jpg"
    //     }, {
    //         id: 10, name: "Michael Hernandez", score: 190, avatar: "https://randomuser.me/api/portraits/men/28.jpg"
    //     }, {
    //         id: 11, name: "Emily Gonzalez", score: 215, avatar: "https://randomuser.me/api/portraits/women/29.jpg"
    //     }, {
    //         id: 12, name: "Jacob Wilson", score: 165, avatar: "https://randomuser.me/api/portraits/men/29.jpg"
    //     }, {
    //         id: 13, name: "Mia Anderson", score: 220, avatar: "https://randomuser.me/api/portraits/women/30.jpg"
    //     }, {
    //         id: 14, name: "Alexander Thomas", score: 160, avatar: "https://randomuser.me/api/portraits/men/30.jpg"
    //     }];
    //     return leaderboard;
    // }

    findAll(): Map<string, QuizSession> {
        return this.quizSessions;
    }

    findOne(code: string): QuizSession {
        const session = this.quizSessions.get(code);
        if (!session) throw new NotFoundException(`Quiz session with code ${code} not found`);
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
