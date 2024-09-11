import {
  Controller,
  Get,
  Query,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
  Req,
  Body,
  Put,
  Delete,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { AppValidationPipe } from '../utils/validation.pipe';
import { UserFindDto } from './dtos/user.find.dto';
import { UsersResult } from './dtos/user.show.dto';
import { IsSuperAdminGuard } from '../auth/is.super.admin.guard';
import { IsEmailVerifiedGuard } from 'src/auth/is-email-verified.guard';
import { EnrollmentRequestFromLeaderDto } from 'src/enrollment/dtos/enrollment-request.dto';
import { RequestWithUser } from 'src/utils/request-with-user';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  async get(
    @Query(AppValidationPipe) findOptions: UserFindDto,
  ): Promise<UsersResult> {
    return this.userService.find(findOptions);
  }

  @Get(':id')
  async getOne(@Param('id', ParseIntPipe) userId: number) {
    return this.userService.findOne(userId);
  }

  @UseGuards(...IsSuperAdminGuard)
  @ApiCookieAuth()
  @Post(':id/promote')
  async promoteUser(@Param('id', ParseIntPipe) userId: number) {
    return this.userService.promoteToAdmin(userId);
  }

  @UseGuards(...IsEmailVerifiedGuard)
  @ApiCookieAuth()
  @Get('enroll-requests')
  async getEnrollRequests(@Req() request: RequestWithUser) {
    return this.userService.getEnrollInvitations(request.currentUser);
  }

  @UseGuards(...IsEmailVerifiedGuard)
  @ApiCookieAuth()
  @Get(':id/enroll-requests')
  async getEnrollRequestsForAnother(
    @Req() request: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.userService.getEnrollInvitationsForAnother(
      id,
      request.currentUser,
    );
  }

  @UseGuards(...IsEmailVerifiedGuard)
  @ApiCookieAuth()
  @Post(':id/enroll-request')
  async enroll(
    @Req() request: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() enrollmentRequest: EnrollmentRequestFromLeaderDto,
  ) {
    await this.userService.createEnrollInvitation(
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
    @Body() enrollmentRequest: EnrollmentRequestFromLeaderDto,
  ) {
    await this.userService.updateEnrollInvitation(
      id,
      request.currentUser,
      enrollmentRequest,
    );
  }

  @UseGuards(...IsEmailVerifiedGuard)
  @ApiCookieAuth()
  @Delete(':id/enroll-request/:projectId')
  async cancelEnrollRequest(
    @Req() request: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Param('projectId', ParseIntPipe) projectId: number,
  ) {
    await this.userService.cancelEnrollInvitation(
      id,
      projectId,
      request.currentUser,
    );
  }
}
