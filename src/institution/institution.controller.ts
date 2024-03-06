import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InstitutionService } from './institution.service';
import { InstitutionFindDto } from './dtos/institution.find.dto';
import { AppValidationPipe } from 'src/utils/validation.pipe';

@ApiTags('institutions')
@Controller('institutions')
export class InstitutionController {
  constructor(private institutionService: InstitutionService) {}

  @Get()
  async get(@Query(AppValidationPipe) findOptions: InstitutionFindDto) {
    return this.institutionService.find(findOptions);
  }
}
