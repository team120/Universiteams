import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsAuthGuard } from '../auth/is-auth.guard';
import { AppValidationPipe } from '../utils/validation.pipe';
import { ProjectFindDto } from './dtos/project.find.dto';
import { ProjectsResult } from './dtos/project.show.dto';
import { ProjectService } from './project.service';
import { Request } from 'express';

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

  @UseGuards(IsAuthGuard)
  @ApiBearerAuth()
  @Post('bookmark/:id')
  bookmark(@Param('id', ParseIntPipe) id: number) {
    return { id: id };
  }
}
