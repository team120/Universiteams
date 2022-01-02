import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SerializationModule } from '../utils/serialization/serialization.module';
import { ProjectController } from './project.controller';
import { Project } from './project.entity';
import { ProjectCustomRepository, QueryCreator } from './project.repository';
import { ProjectService } from './project.service';
import { UniqueWords } from './uniqueWords.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, UniqueWords]),
    SerializationModule,
  ],
  controllers: [ProjectController],
  providers: [ProjectCustomRepository, ProjectService, QueryCreator],
})
export class ProjectModule {}
