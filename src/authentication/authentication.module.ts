import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthenticationService } from './authentication.service';
import { AuthenticationController } from './authentication.controller';
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../users/entities/user.entity";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { JwtStrategy } from "./strategies/passport-jwt-strategy";

@Module({
  controllers: [AuthenticationController],
  providers: [AuthenticationService,JwtStrategy],
  imports:[
    TypeOrmModule.forFeature([User]),
    PassportModule.register({
      defaultStrategy:"jwt",
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('SECRET'),
        signOptions: { expiresIn: 3600 },
      }),
    }),
  ],
  exports: [JwtModule],
})
export class AuthenticationModule {}
