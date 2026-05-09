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
import { OptionsService } from "./options.service";
import { CreateOptionDto } from "./dto/create-option.dto";
import { UpdateOptionDto } from "./dto/update-option.dto";
import { JwtAuthGuard } from "../authentication/Guards/jwt-auth.guard";

@Controller("options")
@UseGuards(JwtAuthGuard)
export class OptionsController {
  constructor(@Inject(OptionsService) private optionsService: OptionsService) {}

  @Post()
  create(@Body() createOptionDto: CreateOptionDto) {
    return this.optionsService.create(createOptionDto);
  }

  @Get()
  findAll() {
    return this.optionsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.optionsService.findOne(+id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateOptionDto: UpdateOptionDto) {
    return this.optionsService.update(id, updateOptionDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.optionsService.remove(id);
  }
}
