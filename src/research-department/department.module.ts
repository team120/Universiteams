import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SerializationModule } from '../utils/serialization/serialization.module';
import { ResearchDepartmentService } from './department.service';
import { ResearchDepartmentController } from './department.controller';
import { ResearchDepartment } from './department.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ResearchDepartment]),
    SerializationModule,
  ],
  providers: [ResearchDepartmentService],
  controllers: [ResearchDepartmentController],
})
export class ResearchDepartmentModule {}
