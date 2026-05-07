import { Injectable } from "@nestjs/common";
import { Option } from "./entities/option.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { CrudService } from "../common/service/crud.service";
import { Repository } from "typeorm";

@Injectable()
export class OptionsService extends CrudService<Option> {
  constructor(
    @InjectRepository(Option)
    private optionRepository: Repository<Option>,
  ) {
    super(optionRepository);
  }

  /*add(options:Option[]) {
    for(const option of options){
      this.optionRepository.create(option);
    }
  }*/
}
