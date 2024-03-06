import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FacilityService } from './facility.service';
import { AppValidationPipe } from '../utils/validation.pipe';
import { FacilityFindDto } from './dtos/facility.find.dto';

@ApiTags('facilities')
@Controller('facilities')
export class FacilityController {
  constructor(private facilityService: FacilityService) {}

  @Get()
  async get(@Query(AppValidationPipe) findOptions: FacilityFindDto) {
    return this.facilityService.find(findOptions);
  }
}
