import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { QuestionsModule } from './questions/questions.module';
import { OptionsModule } from './options/options.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./users/entities/user.entity";
import { Question } from "./questions/entities/question.entity";
import { Quiz } from "./quizzes/entities/quiz.entity";
import { Option } from "./options/entities/option.entity";
import { AuthenticationModule } from './authentication/authentication.module';
import { CommonModule } from './common/common.module';
import {ConfigModule, ConfigService} from '@nestjs/config';
import { QuizSessionModule } from './quizz-session/quiz-session.module';

@Module({
    imports: [UsersModule, QuizzesModule, OptionsModule, QuestionsModule, ConfigModule.forRoot({ isGlobal: true }), // Other imports
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule], useFactory: (configService: ConfigService) => ({
                type: 'mysql',
                host: configService.get<string>('DATABASE_HOST'),
                port: configService.get<number>('DATABASE_PORT'),
                username: configService.get<string>('DATABASE_USERNAME'),
                password: configService.get<string>('DATABASE_PASSWORD'),
                database: configService.get<string>('DATABASE_NAME'),
                entities: [User, Question, Quiz, Option],
                synchronize: configService.get<boolean>('DATABASE_SYNCHRONIZE'),
            }), inject: [ConfigService],
        }), AuthenticationModule, CommonModule, QuizSessionModule],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {
}
