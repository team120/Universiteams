import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SerializationModule } from '../utils/serialization/serialization.module';
import { ResearchDepartmentService } from './department.service';
import { ResearchDepartmentController } from './department.controller';
import { ResearchDepartment } from './department.entity';
import { AuthModule } from '../auth/auth.module';
import { Facility } from 'src/facility/facility.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ResearchDepartment, Facility]),
    AuthModule,
    SerializationModule,
  ],
  providers: [ResearchDepartmentService],
  controllers: [ResearchDepartmentController],
})
export class ResearchDepartmentModule {}
