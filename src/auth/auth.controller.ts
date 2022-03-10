import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { RequestWithUser } from '../utils/request-with-user';
import { EntityMapperService } from '../utils/serialization/entity-mapper.service';
import { AppValidationPipe } from '../utils/validation.pipe';
import { AuthService } from './auth.service';
import {
  CurrentUserDto,
  CurrentUserWithoutTokens,
} from './dtos/current-user.dto';
import {
  ForgetPasswordDto,
  ResetPasswordDto,
} from './dtos/forget-password.dto';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { VerifyDto } from './dtos/verify.dto';
import { IsAuthGuard } from './is-auth.guard';
import { TokenService } from './token.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
    private readonly entityMapper: EntityMapperService,
  ) {}

  @ApiOkResponse({
    description:
      'Returns current user data in JSON format and sets an http-only same-site accessToken cookie',
  })
  @Post('login')
  @HttpCode(200)
  async login(
    @Body(AppValidationPipe) loginDto: LoginDto,
    @Res() response: Response,
  ) {
    const loggedUser = await this.authService.login(loginDto);
    this.populateResponse(response, 200, loggedUser);
  }

  @ApiCreatedResponse({
    description:
      'Returns current user data in JSON format and sets an http-only same-site accessToken cookie',
  })
  @Post('register')
  async register(
    @Body(AppValidationPipe) registerDto: RegisterDto,
    @Res() response: Response,
  ) {
    const registeredUser = await this.authService.register(registerDto);
    this.populateResponse(response, 201, registeredUser);
  }

  private populateResponse(
    response: Response<any, Record<string, any>>,
    statusCode: number,
    currentUser: CurrentUserDto,
  ) {
    this.tokenService.appendTokenCookies(response, currentUser);
    response
      .status(statusCode)
      .json(this.entityMapper.mapValue(CurrentUserWithoutTokens, currentUser));
  }

  @UseGuards(IsAuthGuard)
  @Post('verify-email')
  @HttpCode(200)
  async verifyEmail(
    @Body(AppValidationPipe) verifyDto: VerifyDto,
    @Req() request: RequestWithUser,
  ) {
    await this.authService.verifyEmail(verifyDto, request.currentUser);
  }

  @ApiOkResponse({
    description: 'Sends a forget password email',
  })
  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(
    @Body(AppValidationPipe) forgetPasswordDto: ForgetPasswordDto,
  ) {
    return this.authService.forgotPassword(forgetPasswordDto);
  }

  @ApiOkResponse({
    description:
      'Replaces password of the user embedded in email verification token with the provided one',
  })
  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(
    @Body(AppValidationPipe) resetPasswordDto: ResetPasswordDto,
  ) {
    await this.authService.resetPassword(resetPasswordDto);
  }
}
