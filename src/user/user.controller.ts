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
import { IsEmailVerifiedGuard } from '../auth/is-email-verified.guard';
import { EnrollmentRequestDto } from '../enrollment/dtos/enrollment-request.dto';
import { RequestWithUser } from '../utils/request-with-user';

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
  @Post(':id/invitation/:projectId')
  async createEnrollInvitation(
    @Req() request: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() enrollmentRequest: EnrollmentRequestDto,
  ) {
    await this.userService.createEnrollInvitation(
      id,
      projectId,
      request.currentUser,
      enrollmentRequest,
    );
  }

  @UseGuards(...IsEmailVerifiedGuard)
  @ApiCookieAuth()
  @Put(':id/invitation/:projectId')
  async updateEnrollInvitation(
    @Req() request: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() enrollmentRequest: EnrollmentRequestDto,
  ) {
    await this.userService.updateEnrollInvitation(
      id,
      projectId,
      request.currentUser,
      enrollmentRequest,
    );
  }

  @UseGuards(...IsEmailVerifiedGuard)
  @ApiCookieAuth()
  @Delete(':id/invitation/:projectId')
  async cancelEnrollInvitation(
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
