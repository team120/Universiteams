import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
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
    return await this.projectService.findProjects(findOptions);
  }
}
