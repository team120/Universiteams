import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { SerializationModule } from '../utils/serialization/serialization.module';
import { UserController } from './user.controller';
import { User } from './user.entity';
import { UserService } from './user.service';
import { QueryCreator } from './user.query.creator';
import { AuthModule } from '../auth/auth.module';
import { Enrollment } from '../enrollment/enrollment.entity';
import { Project } from '../project/project.entity';
import { emailQueueProcessor } from '../email/email.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Enrollment, Project]),
    AuthModule,
    SerializationModule,
    BullModule.registerQueue({ name: emailQueueProcessor }),
  ],
  controllers: [UserController],
  providers: [UserService, QueryCreator],
})
export class UserModule {}
