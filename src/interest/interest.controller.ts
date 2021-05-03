import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InterestService } from './interest.service';

@ApiTags('interests')
@Controller('interests')
export class InterestController {
  constructor(private interestService: InterestService) {}

  @Get()
  async get() {
    return this.interestService.findAll();
  }
}
