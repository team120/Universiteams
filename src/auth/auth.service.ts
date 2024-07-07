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
import { VerifyDto } from './dtos/verify.dto';
import { CurrentUserWithoutTokens } from './dtos/current-user.dto';
import { VerificationMessagesService } from '../email/verification-messages.service';
import {
  ForgetPasswordDto,
  ResetPasswordDto,
} from './dtos/forget-password.dto';
import { PinoLogger } from 'nestjs-pino';
import * as argon2 from 'argon2';
import { v4 as uuid } from 'uuid';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { SecretsVaultKeys } from '../utils/secrets';
import { ConfigService } from '@nestjs/config';
import { ProfileInputDto, ProfileOutputDto } from './dtos/profile.dto';
import { Interest } from '../interest/interest.entity';
import { EntityMapperService } from '../utils/serialization/entity-mapper.service';
import { UserAffiliation } from '../user-affiliation/user-affiliation.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Interest)
    private readonly interestRepo: Repository<Interest>,
    private readonly tokenService: TokenService,
    @InjectQueue('emails')
    private readonly emailQueue: Queue,
    private readonly config: ConfigService,
    private readonly verificationMessageService: VerificationMessagesService,
    private readonly logger: PinoLogger,
    private readonly entityMapper: EntityMapperService,
  ) {
    this.logger.setContext(AuthService.name);
  }

  async login(loginDto: LoginDto) {
    const user = await this.userRepo
      .findOne({ where: { email: loginDto.email } })
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
      .findOne({ where: { email: registerDto.email } })
      .catch((e: Error) => {
        throw new DbException(e.message, e.stack);
      });
    if (user) throw new BadRequest(`${registerDto.email} ya esta en uso`);

    const userToInsert = {
      ...registerDto,
      password: await argon2.hash(registerDto.password),
    };
    const insertedUser = await this.userRepo
      .save(userToInsert)
      .catch((e: Error) => {
        throw new DbException(e.message, e.stack);
      });

    await this.emailQueue.add('email-verification', insertedUser);

    return this.tokenService.generateTokens(insertedUser);
  }

  async verifyEmail(
    verifyDto: VerifyDto,
    currentUser: CurrentUserWithoutTokens,
  ) {
    const user = await this.userRepo
      .findOne({
        where: {
          id: currentUser.id,
        },
      })
      .catch((e: Error) => {
        throw new DbException(e.message, e.stack);
      });

    await this.verificationMessageService.checkVerificationEmailToken(
      verifyDto.verificationToken,
      user,
    );

    await this.userRepo
      .update(currentUser.id, { isEmailVerified: true })
      .catch((e: Error) => {
        throw new DbException(e.message, e.stack);
      });
  }

  async forgotPassword(forgetPasswordDto: ForgetPasswordDto) {
    const user = await this.checkEmail(forgetPasswordDto.email);

    await this.emailQueue.add('forgot-password', user).catch((err: Error) => {
      this.logger.error(err, err.message);
    });
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const decodedToken = this.verificationMessageService.checkVerificationToken(
      resetPasswordDto.verificationToken,
      this.config.get(
        SecretsVaultKeys.FORGET_PASSWORD_VERIFICATION_LINK_SECRET,
      ),
    );

    const user = await this.checkEmail(decodedToken.email);

    await this.verificationMessageService.checkForgetPasswordToken(
      decodedToken,
      user,
    );

    const newPassword = await argon2.hash(resetPasswordDto.password);
    await this.userRepo
      .update(user.id, { password: newPassword, refreshUserSecret: uuid() })
      .catch((e: Error) => {
        throw new DbException(e.message, e.stack);
      });
  }

  private async checkEmail(email: string) {
    const user = await this.userRepo
      .findOne({
        where: {
          email: email,
          isEmailVerified: true,
        },
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

  async saveProfile(
    currentUser: CurrentUserWithoutTokens,
    profileDto: ProfileInputDto,
  ) {
    const user = await this.userRepo
      .findOne({
        where: {
          id: currentUser.id,
        },
      })
      .catch((e: Error) => {
        throw new DbException(e.message, e.stack);
      });

    if (!user) throw new Unauthorized('Usuario no encontrado');

    const createdInterestIds: { id: number }[] = [];
    if (profileDto.interestsToCreate) {
      const interests = profileDto.interestsToCreate.map((interest) => ({
        name: interest,
      }));
      const result = await this.interestRepo
        .save(interests)
        .catch((e: Error) => {
          throw new DbException(e.message, e.stack);
        });

      result.forEach((interest) => {
        createdInterestIds.push({ id: interest.id });
      });
    }

    user.interests = profileDto.interestsIds
      .map((id) => ({
        id: id,
      }))
      .concat(createdInterestIds) as Interest[];

    user.userAffiliations = profileDto.researchDepartmentsIds.map((id) => ({
      researchDepartment: {
        id: id,
      },
    })) as UserAffiliation[];

    await this.userRepo.save(user).catch((e: Error) => {
      throw new DbException(e.message, e.stack);
    });
  }

  async getProfile(
    currentUser: CurrentUserWithoutTokens,
  ): Promise<ProfileOutputDto> {
    const user = await this.userRepo
      .findOne({
        where: {
          id: currentUser.id,
        },
        relations: [
          'interests',
          'userAffiliations',
          'userAffiliations.researchDepartment',
          'userAffiliations.researchDepartment.facility',
          'userAffiliations.researchDepartment.facility.institution',
        ],
      })
      .catch((e: Error) => {
        throw new DbException(e.message, e.stack);
      });

    if (!user) throw new Unauthorized('Usuario no encontrado');

    return this.entityMapper.mapValue(ProfileOutputDto, user);
  }
}
