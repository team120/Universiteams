import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UniversityService } from './university.service';

@ApiTags('universities')
@Controller('universities')
export class UniversityController {
  constructor(private universityService: UniversityService) {}
  @Get()
  getUniversities() {
    return this.universityService.findAll();
  }
}
