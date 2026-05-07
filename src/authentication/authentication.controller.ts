import { Body, Controller, Post } from "@nestjs/common";
import { AuthenticationService } from './authentication.service';
import { CreateUserDto } from "../users/dto/create-user.dto";
import { ApiOperation, ApiTags } from "@nestjs/swagger";


@Controller('authentication')
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}
  @ApiTags('authentication')
  @ApiOperation({ summary: 'Creating an account' })
  @Post('/register')
  public  register(@Body() createUser:CreateUserDto):Promise<{}>{
     return  this.authenticationService.register(createUser)
  }

  @ApiTags('authentication')
  @ApiOperation({ summary: 'Logging in'})
  @Post('/login')
  public login (@Body() createUser:CreateUserDto) {
    return this.authenticationService.login(createUser)

  }
}
