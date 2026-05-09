import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Inject,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { QuestionsService } from "./questions.service";
import { CreateQuestionDto } from "./dto/create-question.dto";
import { UpdateQuestionDto } from "./dto/update-question.dto";
import { JwtAuthGuard } from "../authentication/Guards/jwt-auth.guard";

@ApiTags("questions")
@ApiBearerAuth("bearer")
@Controller("questions")
@UseGuards(JwtAuthGuard)
export class QuestionsController {
  constructor(
    @Inject(QuestionsService) private questionsService: QuestionsService,
  ) {}

  @Post()
  create(@Body() createQuestionDto: CreateQuestionDto) {
    return this.questionsService.create(createQuestionDto);
  }

  @Get()
  findAll() {
    return this.questionsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.questionsService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateQuestionDto: UpdateQuestionDto,
  ) {
    return this.questionsService.update(id, updateQuestionDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.questionsService.remove(id);
  }
}
