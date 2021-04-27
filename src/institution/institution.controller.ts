import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InstitutionService } from './institution.service';

@ApiTags('institutions')
@Controller('institutions')
export class InstitutionController {
  constructor(private institutionService: InstitutionService) {}
  @Get()
  getUniversities() {
    return this.institutionService.findAll();
  }
}
