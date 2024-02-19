import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SerializationModule } from '../utils/serialization/serialization.module';
import { Facility } from './facility.entity';
import { FacilityService } from './facility.service';
import { FacilityController } from './facility.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Facility]), SerializationModule],
  providers: [FacilityService],
  controllers: [FacilityController],
})
export class FacilityModule {}
