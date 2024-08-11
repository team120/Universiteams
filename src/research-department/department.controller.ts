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
import { AppValidationPipe } from '../utils/validation.pipe';
import { ResearchDepartmentFindDto } from './dtos/department.find.dto';
import { ResearchDepartmentService } from './department.service';
import { IsAdminGuard } from 'src/auth/is.admin.guard';
import { ResearchDepartmentCreateDto } from './dtos/department.create.dto';
import { ResearchDepartmentUpdateDto } from './dtos/department.update.dto';

@ApiTags('research-departments')
@Controller('research-departments')
export class ResearchDepartmentController {
  constructor(private departmentService: ResearchDepartmentService) {}

  @Get()
  async get(@Query(AppValidationPipe) findOptions: ResearchDepartmentFindDto) {
    return this.departmentService.find(findOptions);
  }
  @Get(':id')
  async getOne(@Param('id', ParseIntPipe) departmentId: number) {
    return this.departmentService.findById(departmentId);
  }
  @UseGuards(...IsAdminGuard)
  @ApiCookieAuth()
  @Post()
  async create(@Body() departmentDto: ResearchDepartmentCreateDto) {
    return this.departmentService.create(departmentDto);
  }
  @UseGuards(...IsAdminGuard)
  @ApiCookieAuth()
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.departmentService.delete(id);
  }
  @UseGuards(...IsAdminGuard)
  @ApiCookieAuth()
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() departmentDto: ResearchDepartmentUpdateDto,
  ) {
    return this.departmentService.update(id, departmentDto);
  }
}
