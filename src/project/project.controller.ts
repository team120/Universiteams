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
import { EnrollmentRequestDto } from '../enrollment/dtos/enrollment.request.dto';
import { UnenrollDto } from '../enrollment/dtos/unenroll.dto';
import { EnrollmentRequestAdminDto } from '../enrollment/dtos/enrollment-request-admin.dto';

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

  @UseInterceptors(SetCurrentUserInterceptor)
  @Get(':id')
  async getOne(
    @Req() request: RequestWithUser,
    @Param('id', ParseIntPipe) projectId: number,
  ) {
    return this.projectService.findOne(projectId, request.currentUser);
  }

  @UseGuards(...IsEmailVerifiedGuard)
  @ApiCookieAuth()
  @Post(':id/favorite')
  async favorite(
    @Req() request: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.projectService.favorite(id, request.currentUser);
  }

  @UseGuards(...IsEmailVerifiedGuard)
  @ApiCookieAuth()
  @Delete(':id/favorite')
  async unfavorite(
    @Req() request: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.projectService.unfavorite(id, request.currentUser);
  }

  @UseGuards(...IsEmailVerifiedGuard)
  @ApiCookieAuth()
  @Post(':id/enroll-request')
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

  @UseGuards(...IsEmailVerifiedGuard)
  @ApiCookieAuth()
  @Put(':id/enroll-request')
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
  @Get(':id/enroll-requests')
  async getEnrollRequests(
    @Req() request: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.projectService.getEnrollRequests(id, request.currentUser);
  }

  @UseGuards(...IsEmailVerifiedGuard)
  @ApiCookieAuth()
  @Delete(':id/enroll-request')
  async cancelEnrollRequest(
    @Req() request: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.projectService.cancelEnrollRequest(id, request.currentUser);
  }

  @UseGuards(...IsEmailVerifiedGuard)
  @ApiCookieAuth()
  @Put(':id/unenroll')
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

  @UseGuards(...IsEmailVerifiedGuard)
  @ApiCookieAuth()
  @Put(':id/enroll-requests/:userId/approve')
  async approveEnrollRequest(
    @Req() request: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() enrollRequestAdminDto: EnrollmentRequestAdminDto,
  ) {
    await this.projectService.manageEnrollRequest(
      id,
      userId,
      request.currentUser,
      enrollRequestAdminDto,
      'approve',
    );
  }

  @UseGuards(...IsEmailVerifiedGuard)
  @ApiCookieAuth()
  @Put(':id/enroll-requests/:userId/reject')
  async rejectEnrollRequest(
    @Req() request: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() enrollRequestAdminDto: EnrollmentRequestAdminDto,
  ) {
    await this.projectService.manageEnrollRequest(
      id,
      userId,
      request.currentUser,
      enrollRequestAdminDto,
      'reject',
    );
  }
}
