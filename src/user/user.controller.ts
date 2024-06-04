import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  async get() {
    return this.userService.findAll();
  }

  @Get(':id')
  async getOne(@Param('id', ParseIntPipe) userId: number) {
    return this.userService.findOne(userId);
  }
}
