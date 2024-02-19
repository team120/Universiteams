import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppValidationPipe } from 'src/utils/validation.pipe';
import { ResearchDepartmentFindDto } from './dtos/department.find.dto';
import { ResearchDepartmentService } from './department.service';

@ApiTags('research-departments')
@Controller('research-departments')
export class ResearchDepartmentController {
  constructor(private departmentService: ResearchDepartmentService) {}

  @Get()
  async get(@Query(AppValidationPipe) findOptions: ResearchDepartmentFindDto) {
    return this.departmentService.find(findOptions);
  }
}
