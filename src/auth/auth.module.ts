import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { SerializationModule } from '../utils/serialization/serialization.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { IsAuthGuard } from './is-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    SerializationModule,
    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, IsAuthGuard],
  exports: [
    IsAuthGuard,
    TypeOrmModule.forFeature([User]),
    SerializationModule,
    ConfigModule,
  ],
})
export class AuthModule {}
