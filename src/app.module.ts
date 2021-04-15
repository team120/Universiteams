import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './auth/auth.controller';
import { UniversityController } from './university/university.controller';
import { UserController } from './user/user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectModule } from './project/project.module';

@Module({
  imports: [TypeOrmModule.forRoot(), ProjectModule],
  controllers: [
    AppController,
    AuthController,
    UniversityController,
    UserController,
  ],
  providers: [AppService],
})
export class AppModule {}
