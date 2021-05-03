import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InstitutionService } from './institution.service';

@ApiTags('institutions')
@Controller('institutions')
export class InstitutionController {
  constructor(private institutionService: InstitutionService) {}

  @Get()
  async get() {
    return this.institutionService.findAll();
  }
}
