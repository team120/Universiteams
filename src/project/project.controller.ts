import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { IsEmailVerifiedGuard } from '../auth/is-email-verified.guard';
import { RequestWithUser } from '../utils/request-with-user';
import { AppValidationPipe } from '../utils/validation.pipe';
import { ProjectFindDto } from './dtos/project.find.dto';
import { ProjectsResult } from './dtos/project.show.dto';
import { ProjectService } from './project.service';
import { SetCurrentUserInterceptor } from '../auth/current-user.interceptor';

@ApiTags('projects')
@Controller('projects')
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  @UseInterceptors(SetCurrentUserInterceptor)
  @Get()
  async get(
    @Req() request: RequestWithUser,
    @Query(AppValidationPipe) findOptions: ProjectFindDto,
  ): Promise<ProjectsResult> {
    return this.projectService.find(findOptions, request.currentUser);
  }

  @Get(':id')
  async getOne(@Param('id', ParseIntPipe) projectId: number) {
    return this.projectService.findOne(projectId);
  }

  @UseGuards(...IsEmailVerifiedGuard)
  @ApiCookieAuth()
  @Post('favorite/:id')
  async favorite(
    @Req() request: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.projectService.favorite(id, request.currentUser);
  }

  @UseGuards(...IsEmailVerifiedGuard)
  @ApiCookieAuth()
  @Delete('favorite/:id')
  async unfavorite(
    @Req() request: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.projectService.unfavorite(id, request.currentUser);
  }
}
