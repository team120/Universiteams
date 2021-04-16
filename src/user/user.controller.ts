import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  async getUsers() {
    return this.userService.findAll();
  }

  @Get(':id')
  getUser(@Param('id', ParseIntPipe) userId: number) {
    return this.userService.findOne(userId);
  }
}
