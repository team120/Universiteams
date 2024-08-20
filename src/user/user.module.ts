import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SerializationModule } from '../utils/serialization/serialization.module';
import { UserController } from './user.controller';
import { User } from './user.entity';
import { UserService } from './user.service';
import { QueryCreator } from './user.query.creator';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), AuthModule, SerializationModule],
  controllers: [UserController],
  providers: [UserService, QueryCreator],
})
export class UserModule {}
