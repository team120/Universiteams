import { Controller, Get, Post } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  @Post('register')
  register() {
    return 'register';
  }

  @Post('login')
  login() {
    return 'login';
  }
}
