import {User} from '../../users/entities/user.entity';
import {Quiz} from '../../quizzes/entities/quiz.entity';
import {Player} from './player.entity';

export class QuizSession {
    quiz: Quiz;

    quizCode: string;

    owner: User;

    hasStarted: boolean;

    players: Player[];

    ownerSocketId?: string;

    currentQuestionNumber?: number;

    currentQuestionStartTime?: number;

    pendingTimer?: NodeJS.Timeout;

    constructor() {
        this.players = [];
    }
}
