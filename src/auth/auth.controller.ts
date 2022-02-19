import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppValidationPipe } from '../utils/validation.pipe';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body(AppValidationPipe) loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
