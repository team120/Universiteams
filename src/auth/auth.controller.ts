import { Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
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
