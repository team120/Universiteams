import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InstitutionService } from './institution.service';
import { InstitutionFindDto } from './dtos/institution.find.dto';
import { AppValidationPipe } from '../utils/validation.pipe';
import { InstitutionCreateDto } from './dtos/institution.create.dto';

@ApiTags('institutions')
@Controller('institutions')
export class InstitutionController {
  constructor(private institutionService: InstitutionService) {}

  @Get()
  async get(@Query(AppValidationPipe) findOptions: InstitutionFindDto) {
    return this.institutionService.find(findOptions);
  }
  @Post()
  async create(@Body() institution: InstitutionCreateDto) {
    return this.institutionService.create(institution);
  }
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.institutionService.delete(id);
  }
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() institution: InstitutionCreateDto,
  ) {
    return this.institutionService.update(id, institution);
  }
}
