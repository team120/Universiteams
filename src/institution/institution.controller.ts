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
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { InstitutionService } from './institution.service';
import { InstitutionFindDto } from './dtos/institution.find.dto';
import { AppValidationPipe } from '../utils/validation.pipe';
import { InstitutionCreateDto } from './dtos/institution.create.dto';
import { IsAdminGuard } from '../auth/is.admin.guard';
import { InstitutionUpdateDto } from './dtos/institution.update.dto';

@ApiTags('institutions')
@Controller('institutions')
export class InstitutionController {
  constructor(private institutionService: InstitutionService) {}

  @Get()
  async get(@Query(AppValidationPipe) findOptions: InstitutionFindDto) {
    return this.institutionService.find(findOptions);
  }
  @UseGuards(...IsAdminGuard)
  @ApiCookieAuth()
  @Post()
  async create(@Body() institution: InstitutionCreateDto) {
    return this.institutionService.create(institution);
  }
  @UseGuards(...IsAdminGuard)
  @ApiCookieAuth()
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.institutionService.delete(id);
  }
  @UseGuards(...IsAdminGuard)
  @ApiCookieAuth()
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() institution: InstitutionUpdateDto,
  ) {
    return this.institutionService.update(id, institution);
  }
}
