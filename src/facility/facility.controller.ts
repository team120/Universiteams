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
import { FacilityService } from './facility.service';
import { AppValidationPipe } from '../utils/validation.pipe';
import { FacilityFindDto } from './dtos/facility.find.dto';
import { IsAdminGuard } from 'src/auth/is.admin.guard';
import { FacilityCreateDto } from './dtos/facility.create.dto';
import { FacilityUpdateDto } from './dtos/facility.update.dto';

@ApiTags('facilities')
@Controller('facilities')
export class FacilityController {
  constructor(private facilityService: FacilityService) {}

  @Get()
  async get(@Query(AppValidationPipe) findOptions: FacilityFindDto) {
    return this.facilityService.find(findOptions);
  }
  @Get(':id')
  async getOne(@Param('id', ParseIntPipe) facilityId: number) {
    return this.facilityService.findById(facilityId);
  }
  @UseGuards(...IsAdminGuard)
  @ApiCookieAuth()
  @Post()
  async create(@Body() facility: FacilityCreateDto) {
    return this.facilityService.create(facility);
  }
  @UseGuards(...IsAdminGuard)
  @ApiCookieAuth()
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.facilityService.delete(id);
  }
  @UseGuards(...IsAdminGuard)
  @ApiCookieAuth()
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() facility: FacilityUpdateDto,
  ) {
    return this.facilityService.update(id, facility);
  }
}
