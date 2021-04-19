import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SerializationModule } from '../serialization/serialization.module';
import { ProjectController } from './project.controller';
import { Project } from './project.entity';
import { ProjectService } from './project.service';

@Module({
  imports: [TypeOrmModule.forFeature([Project]), SerializationModule],
  controllers: [ProjectController],
  providers: [ProjectService],
})
export class ProjectModule {}
