import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InterestService } from './interest.service';
import { AppValidationPipe } from '../utils/validation.pipe';
import { InterestFindDto } from './dtos/interest.find.dto';

@ApiTags('interests')
@Controller('interests')
export class InterestController {
  constructor(private interestService: InterestService) {}

  @Get()
  async get(@Query(AppValidationPipe) findOptions: InterestFindDto) {
    return this.interestService.find(findOptions);
  }
}
