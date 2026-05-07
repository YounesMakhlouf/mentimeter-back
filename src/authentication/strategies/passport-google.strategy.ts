import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from "passport-google-oauth20";
import { Injectable } from '@nestjs/common';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL_GOOGLE,
      scope: ['email', 'profile'],
    });
  }
  async validate(accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback): Promise<any> {
    const { emails,id } = profile
    const user = {
      email: emails[0].value,
      id:id,
      accessToken
    }
    done(null, user);
  }
}