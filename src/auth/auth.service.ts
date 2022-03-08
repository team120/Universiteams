import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { LoginDto } from './dtos/login.dto';
import {
  BadRequest,
  DbException,
  Unauthorized,
} from '../utils/exceptions/exceptions';
import { RegisterDto } from './dtos/register.dto';
import { TokenService } from './token.service';
import { EmailService } from '../email/email.service';
import { VerifyDto } from './dtos/verify.dto';
import { CurrentUserWithoutTokens } from './dtos/current-user.dto';
import { VerificationMessagesService } from '../email/verification-messages.service';
import {
  ForgetPasswordDto,
  ResetPasswordDto,
} from './dtos/forget-password.dto';
import { PinoLogger } from 'nestjs-pino';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly tokenService: TokenService,
    private readonly emailService: EmailService,
    private readonly verificationEmailToken: VerificationMessagesService,
    private readonly logger: PinoLogger,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.userRepo
      .findOne({ email: loginDto.email })
      .catch((e: Error) => {
        throw new DbException(e.message, e.stack);
      });
    if (!user) throw new Unauthorized('User not found');

    const hashMatches = await argon2.verify(user.password, loginDto.password);
    if (!hashMatches) throw new Unauthorized('Password not matching');

    return this.tokenService.generateTokens(user);
  }

  async register(registerDto: RegisterDto) {
    const user = await this.userRepo
      .findOne({ email: registerDto.email })
      .catch((e: Error) => {
        throw new DbException(e.message, e.stack);
      });
    if (user) throw new BadRequest(`${registerDto.email} is already taken`);

    const userToInsert = {
      ...registerDto,
      password: await argon2.hash(registerDto.password),
    };
    const insertedUser = await this.userRepo
      .save(userToInsert)
      .catch((e: Error) => {
        throw new DbException(e.message, e.stack);
      });

    await this.emailService
      .sendVerificationEmail(insertedUser)
      .catch((err: Error) => {
        this.logger.error(err, err.message);
      });

    return this.tokenService.generateTokens(insertedUser);
  }

  async verifyEmail(
    verifyDto: VerifyDto,
    currentUser: CurrentUserWithoutTokens,
  ) {
    const decodedToken = this.verificationEmailToken.checkVerifyEmailToken(
      verifyDto.verificationToken,
    );
    if (decodedToken.id !== currentUser.id)
      throw new Unauthorized('Current user id does not match verification url');

    await this.userRepo
      .update(currentUser.id, { isEmailVerified: true })
      .catch((e: Error) => {
        throw new DbException(e.message, e.stack);
      });
  }

  async forgotPassword(forgetPasswordDto: ForgetPasswordDto) {
    const user = await this.checkEmail(forgetPasswordDto.email);

    await this.emailService.sendForgetPasswordEmail(user);
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.checkEmail(resetPasswordDto.email);

    const decodedToken = this.verificationEmailToken.checkForgetPasswordToken(
      resetPasswordDto.verificationToken,
    );
    if (decodedToken.email !== resetPasswordDto.email)
      throw new Unauthorized(
        'Request user email does not match verification url',
      );

    const newPassword = await argon2.hash(resetPasswordDto.password);
    await this.userRepo
      .update(user.id, { password: newPassword })
      .catch((e: Error) => {
        throw new DbException(e.message, e.stack);
      });
  }

  private async checkEmail(email: string) {
    const user = await this.userRepo
      .findOne({
        email: email,
        isEmailVerified: true,
      })
      .catch((e: Error) => {
        throw new DbException(e.message, e.stack);
      });

    if (!user)
      throw new BadRequest(
        'That address is either not a verified email or is not associated with a personal user account',
      );

    return user;
  }
}
