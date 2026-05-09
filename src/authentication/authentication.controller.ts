import { Body, Controller, Post } from "@nestjs/common";
import { AuthenticationService } from "./authentication.service";
import { CreateUserDto } from "../users/dto/create-user.dto";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

@ApiTags("authentication")
@Controller("authentication")
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  @ApiOperation({ summary: "Create an account" })
  @Post("/register")
  public register(@Body() createUser: CreateUserDto): Promise<unknown> {
    return this.authenticationService.register(createUser);
  }

  @ApiOperation({
    summary: "Log in",
    description: "Returns { accessToken, username, email } on success.",
  })
  @Post("/login")
  public login(@Body() createUser: CreateUserDto) {
    return this.authenticationService.login(createUser);
  }
}
