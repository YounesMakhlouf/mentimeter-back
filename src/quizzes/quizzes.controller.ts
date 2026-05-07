import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Inject,
} from "@nestjs/common";
import { QuizzesService } from "./quizzes.service";
import { CreateQuizDto } from "./dto/create-quiz.dto";
import { UpdateQuizDto } from "./dto/update-quiz.dto";
import { JwtAuthGuard } from "../authentication/Guards/jwt-auth.guard";
import { CurrentUser } from "../authentication/decorators/current-user.decorator";

@Controller("quizzes")
@UseGuards(JwtAuthGuard)
export class QuizzesController {
  constructor(@Inject(QuizzesService) private quizzesService: QuizzesService) {}

  @Post()
  create(
    @Body() createQuizDto: CreateQuizDto,
    @CurrentUser("email") email: string,
  ) {
    return this.quizzesService.saveQuiz(createQuizDto, email);
  }

  @Get()
  findAll() {
    return this.quizzesService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.quizzesService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateQuizDto: UpdateQuizDto) {
    return this.quizzesService.update(id, updateQuizDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.quizzesService.remove(id);
  }
}
