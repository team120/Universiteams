import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProjectController } from './project/project.controller';
import { AuthController } from './auth/auth.controller';
import { UniversityController } from './university/university.controller';
import { UserController } from './user/user.controller';

@Module({
  imports: [],
  controllers: [AppController, ProjectController, AuthController, UniversityController, UserController],
  providers: [AppService],
})
export class AppModule {}
