import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { LoginDto } from './dtos/login.dto';
import * as argon2 from 'argon2';
import * as jwt from 'jsonwebtoken';
import { EntityMapperService } from '../utils/serialization/entity-mapper.service';
import { LoggedUserDto } from './dtos/logged-user.dto';
import {
  BadRequest,
  DbException,
  Unauthorized,
} from '../utils/exceptions/exceptions';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dtos/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly entityMapper: EntityMapperService,
    private readonly configService: ConfigService,
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

    return this.generateToken(user);
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

    return this.generateToken(insertedUser);
  }

  private generateToken(user: User) {
    const tokenPayload = {
      id: user.id,
      user: `${user.firstName} ${user.lastName}`,
      email: user.email,
    };

    return this.entityMapper.mapValue(LoggedUserDto, {
      ...user,
      accessToken: `Bearer ${jwt.sign(
        tokenPayload,
        this.configService.get('JWT_SECRET'),
        {
          expiresIn: '15m',
        },
      )}`,
    });
  }
}
