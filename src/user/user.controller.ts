import {
  Controller,
  Get,
  Query,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { AppValidationPipe } from '../utils/validation.pipe';
import { UserFindDto } from './dtos/user.find.dto';
import { UsersResult } from './dtos/user.show.dto';
import { IsSuperAdminGuard } from 'src/auth/is.super.admin.guard';

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
  @Post('/promote/:id')
  async promoteUser(@Param('id', ParseIntPipe) userId: number) {
    return this.userService.promoteToAdmin(userId);
  }
}
