import { Controller, Get, Body, Patch, Param, Delete, NotFoundException, ForbiddenException, UseGuards } from "@nestjs/common";
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from "../authentication/Guards/jwt-auth.guard";
import { CurrentUser } from "../authentication/decorators/current-user.decorator";

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}


  @Get(':email/quizzes')
  async findUserQuizzes(
    @Param('email') email: string,
    @CurrentUser('email') me: string,
  ) {
    if (email !== me) {
      throw new ForbiddenException();
    }
    const user = await this.usersService.getUserWithQuizzes(email);
    if (!user) {
      throw new NotFoundException(`no user with email ${email}`);
    }
    return user.quizzes;
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
