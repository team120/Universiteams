import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { Unauthorized } from '../utils/exceptions/exceptions';
import { EntityMapperService } from '../utils/serialization/entity-mapper.service';
import { TokenDecoded } from './dtos/token';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { EmbeddedUserInResponse } from './dtos/logged-user.show.dto';

@Injectable()
export class IsAuthGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly entityMapper: EntityMapperService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    const fullInputToken: string | undefined = request.get('Authorization');
    if (!fullInputToken) throw new Unauthorized('Token not provided');

    const tokenWithoutPrefix = fullInputToken.replace('Bearer ', '');

    const decodedToken = this.checkAndDecodeToken(tokenWithoutPrefix);

    const user = await this.userRepo.findOne(decodedToken.id);
    if (!user)
      throw new Unauthorized("Token's associated id doesn't match any user");

    request.user = this.entityMapper.mapValue(EmbeddedUserInResponse, user);

    return true;
  }

  private checkAndDecodeToken(token: string): TokenDecoded {
    try {
      return this.entityMapper.mapValue(
        TokenDecoded,
        jwt.verify(token, this.configService.get('JWT_SECRET')),
      );
    } catch {
      throw new Unauthorized(`Token is not valid (${token})`);
    }
  }
}
