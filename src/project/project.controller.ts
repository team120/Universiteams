import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppValidationPipe } from '../utils/validation.pipe';
import { ProjectFindDto } from './dtos/project.find.dto';
import { ProjectsResult } from './dtos/project.show.dto';
import { ProjectService } from './project.service';

@ApiTags('projects')
@Controller('projects')
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  @Get()
  async get(
    @Query(AppValidationPipe) findOptions: ProjectFindDto,
  ): Promise<ProjectsResult> {
    return this.projectService.findProjects(findOptions);
  }

  @Get(':id')
  async getOne(@Param('id', ParseIntPipe) projectId: number) {
    return this.projectService.findOne(projectId);
  }
}
