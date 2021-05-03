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
import { ProjectFindDto } from './dtos/project.find.dto';
import { ProjectShowDto } from './dtos/project.show.dto';
import { ProjectService } from './project.service';

@ApiTags('projects')
@Controller('projects')
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  async get(@Query() findOptions: ProjectFindDto): Promise<ProjectShowDto[]> {
    return this.projectService.findProjects(findOptions);
  }

  @Get(':id')
  async getOne(@Param('id', ParseIntPipe) projectId: number) {
    return this.projectService.findOne(projectId);
  }
}
