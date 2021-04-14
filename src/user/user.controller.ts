import { Controller, Get, Param } from '@nestjs/common';

@Controller('users')
export class UserController {
  @Get()
  getUsers() {}

  @Get(':id')
  getUser(@Param('id') userId: number) {
    return userId;
  }
}
