import { Controller, Get, Query, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { AppValidationPipe } from 'src/utils/validation.pipe';
import { UserFindDto } from './dtos/user.find.dto';
import { UsersResult } from './dtos/user.show.dto';

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
}
