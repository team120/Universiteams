import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SerializationModule } from '../utils/serialization/serialization.module';
import { Interest } from './interest.entity';
import { InterestController } from './interest.controller';
import { InterestService } from './interest.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Interest]),
    AuthModule,
    SerializationModule,
  ],
  providers: [InterestService],
  controllers: [InterestController],
})
export class InterestModule {}
