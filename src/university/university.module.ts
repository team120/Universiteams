import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SerializationModule } from '../serialization/serialization.module';
import { UniversityController } from './university.controller';
import { University } from './university.entity';
import { UniversityService } from './university.service';

@Module({
  imports: [TypeOrmModule.forFeature([University]), SerializationModule],
  providers: [UniversityService],
  controllers: [UniversityController],
})
export class UniversityModule {}
