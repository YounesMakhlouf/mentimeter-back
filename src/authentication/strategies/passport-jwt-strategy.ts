import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../../users/entities/user.entity";
import { PayloadInterface } from "../Interfaces/payload.interface";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    config: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>("SECRET"),
    });
  }

  async validate(payload: PayloadInterface) {
    const user: User = await this.userRepository.findOneBy({
      email: payload.email,
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
