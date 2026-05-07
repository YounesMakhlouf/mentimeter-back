import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from "@nestjs/common";
import { Repository } from "typeorm";
import { User } from "../users/entities/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { CreateUserDto } from "../users/dto/create-user.dto";
import * as bcrypt from 'bcrypt';
import { response } from "express";
import { JwtService } from "@nestjs/jwt";
import * as jwt from 'jsonwebtoken'
import { isAlphanumeric } from "class-validator";

@Injectable()
export class AuthenticationService {
  constructor(
    @InjectRepository(User)
    private userRepository : Repository<User>,
    private jwtService:JwtService,
  ) {}

  public async register(createUserDto: CreateUserDto):Promise<{}> {

    let email: string = createUserDto.email;
    let password: string = createUserDto.password;
    let existEmail:User = await this.userRepository.findOneBy({ email: email })
    if (existEmail) {
      throw new BadRequestException(`email ${email} is already used`)
    }
    const salt: string = await bcrypt.genSalt();
    const hashedPassword: string = await bcrypt.hash(password, salt);
    let user:Partial<User> = {
      email:email,
      password:hashedPassword,
    }
    await this.userRepository.save(user)
    let i:number=0
    let username:string=""
    while( i < user.email.length && isAlphanumeric(user.email[i])) {
      username+=user.email[i];
      i++;
    }
    return{
      "email":email,
      "username":username,
    }
  }

  public async login(createUser:CreateUserDto):Promise<{}>{
    let email=createUser.email;
    let password=createUser.password;
    let user:User= await this.userRepository.findOneBy({email:email});
    if(!user){
      throw new BadRequestException(`no user is registered under ${email}`)
    }
    let hashedPassword:string=user.password;
    let response=await bcrypt.compare( password,hashedPassword)
    if(!response){
      throw new UnauthorizedException("wrong password!")
    }
    let payload={
      email:user.email,
    }
    const jwt:string=this.jwtService.sign(payload);
    let i:number=0
    let username:string=""
    while( i < user.email.length && isAlphanumeric(user.email[i])) {
        username+=user.email[i];
        i++;
    }
    return{
      "accessToken":jwt,
      "username":username,
      "email":email,
    }
  }

  async googleLogin(req:any) {
    if (!req.user) {
      throw new InternalServerErrorException("an error occured while connecting to google ! ")
    }
    let user_info = req.user
    let existUser:User=await this.userRepository.findOneBy({email:user_info.email})
    if(!existUser){
      let user: User = new User();
      user.email = user_info.email;
      user.googleId = user_info.id;
      await this.userRepository.save(user)
    }
    let email=existUser?existUser.email:user_info.email;
    let payload={
      email:email,
    }
    let i:number=0
    let username:string=""
    while( i < email.length && isAlphanumeric(email[i])) {
      username+=email[i];
      i++;
    }
    const jwt:string=this.jwtService.sign(payload);
    return{
      "accessToken":jwt,
      "username":username,

    }

  }
}

