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
import { Enrollment } from '../enrollment/enrolment.entity';
import { EnrollmentRequestDto } from '../enrollment/dtos/enrollment.request.dto';
import { UnenrollDto } from '../enrollment/dtos/unenroll.dto';

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

  @UseGuards(...IsEmailVerifiedGuard)
  @ApiCookieAuth()
  @Post('enroll-request/:id')
  async enroll(
    @Req() request: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() enrollmentRequest: EnrollmentRequestDto,
  ) {
    await this.projectService.requestEnroll(
      id,
      request.currentUser,
      enrollmentRequest,
    );
  }

  // PUT /projects/enroll-request/:id
  @UseGuards(...IsEmailVerifiedGuard)
  @ApiCookieAuth()
  @Put('enroll-request/:id')
  async updateEnrollRequest(
    @Req() request: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() enrollmentRequest: EnrollmentRequestDto,
  ) {
    await this.projectService.updateEnrollRequest(
      id,
      request.currentUser,
      enrollmentRequest,
    );
  }

  @UseGuards(...IsEmailVerifiedGuard)
  @ApiCookieAuth()
  @Delete('enroll-request/:id')
  async cancelEnrollRequest(
    @Req() request: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.projectService.cancelEnrollRequest(id, request.currentUser);
  }

  @UseGuards(...IsEmailVerifiedGuard)
  @ApiCookieAuth()
  @Put('unenroll/:id')
  async unenroll(
    @Req() request: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() unenrollOptions: UnenrollDto,
  ) {
    await this.projectService.unenroll(
      id,
      request.currentUser,
      unenrollOptions,
    );
  }
}
