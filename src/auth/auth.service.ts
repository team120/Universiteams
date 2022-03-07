import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { LoginDto } from './dtos/login.dto';
import * as argon2 from 'argon2';
import {
  BadRequest,
  DbException,
  Unauthorized,
} from '../utils/exceptions/exceptions';
import { RegisterDto, RegisteredUser } from './dtos/register.dto';
import { TokenService } from './token.service';
import { EmailService } from '../email/email.service';
import { VerifyDto } from './dtos/verify.dto';
import { CurrentUserWithoutTokens } from './dtos/current-user.dto';
import { VerificationMessagesService } from '../email/verification-messages.service';
import { PinoLogger } from 'nestjs-pino';

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

  async register(registerDto: RegisterDto): Promise<RegisteredUser> {
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

    const emailError: string | undefined = await this.emailService
      .sendVerificationEmail(insertedUser)
      .then(() => {
        return undefined;
      })
      .catch((err: Error) => {
        this.logger.error(err, err.message);
        return 'Verification email will take a bit longer than expected to arrive.\nIf that never happens, please contact support';
      });

    return {
      user: this.tokenService.generateTokens(insertedUser),
      emailError: emailError,
    };
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
      .update(currentUser.id, { isMailVerified: true })
      .catch((e: Error) => {
        throw new DbException(e.message, e.stack);
      });
  }
}
