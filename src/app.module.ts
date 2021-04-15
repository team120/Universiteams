import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProjectController } from './project/project.controller';
import { AuthController } from './auth/auth.controller';
import { UniversityController } from './university/university.controller';
import { UserController } from './user/user.controller';
import { ProjectService } from './project/project.service';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forRoot()],
  controllers: [
    AppController,
    ProjectController,
    AuthController,
    UniversityController,
    UserController,
  ],
  providers: [AppService, ProjectService],
})
export class AppModule {}
