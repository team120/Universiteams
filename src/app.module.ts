import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './auth/auth.controller';
import { UniversityController } from './university/university.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectModule } from './project/project.module';
import { UserModule } from './user/user.module';
import { SharedModule } from './shared/shared.module';
import { LoggerModule } from './logger/logger.module';
import { ExceptionsModule } from './exceptions/exceptions.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(),
    ProjectModule,
    UserModule,
    SharedModule,
    LoggerModule,
    ExceptionsModule,
  ],
  controllers: [AppController, AuthController, UniversityController],
  providers: [AppService],
})
export class AppModule {}
