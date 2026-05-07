import { Module } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { AuthenticationController } from './authentication.controller';
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../users/entities/user.entity";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import * as process from "process";
import * as dotenv from "dotenv"
import { JwtStrategy } from "./strategies/passport-jwt-strategy";
import { GoogleStrategy } from "./strategies/passport-google.strategy";
dotenv.config();

@Module({
  controllers: [AuthenticationController],
  providers: [AuthenticationService,JwtStrategy,GoogleStrategy],
  imports:[
    TypeOrmModule.forFeature([User]),
    PassportModule.register({
      defaultStrategy:"jwt",
    }),
    JwtModule.register({
      secret:process.env.SECRET,
      signOptions:{expiresIn:3600}
    })
  ],
  exports: [JwtModule],
})
export class AuthenticationModule {}
