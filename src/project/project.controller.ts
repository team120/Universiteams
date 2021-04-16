import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ProjectFindDto } from './dtos/project.find.dto';
import { ProjectShowDto } from './dtos/project.show.dto';
import { ProjectService } from './project.service';

@Controller('projects')
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  async getProjects(
    @Query() findOptions: ProjectFindDto,
  ): Promise<ProjectShowDto[]> {
    return this.projectService.findProjects(findOptions);
  }

  @Get(':id')
  async getOneProject(@Param('id', ParseIntPipe) projectId: number) {
    return this.projectService.findOne(projectId);
  }
}
