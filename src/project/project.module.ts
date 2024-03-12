import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CurrentDateService,
  CURRENT_DATE_SERVICE,
} from '../utils/current-date';
import { SerializationModule } from '../utils/serialization/serialization.module';
import { ProjectController } from './project.controller';
import { Project } from './project.entity';
import { ProjectPropCompute } from './project.prop-compute';
import { QueryCreator } from './project.query.creator';
import { ProjectService } from './project.service';
import { UniqueWordsService } from './unique-words.service';
import { UniqueWords } from './unique-words.entity';
import { StopWords } from '../database/stop-words.entity';
import { AuthModule } from '../auth/auth.module';
import { Favorite } from '../favorite/favorite.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, UniqueWords, StopWords, Favorite]),
    SerializationModule,
    AuthModule,
  ],
  controllers: [ProjectController],
  providers: [
    ProjectService,
    QueryCreator,
    UniqueWordsService,
    ProjectPropCompute,
    { provide: CURRENT_DATE_SERVICE, useClass: CurrentDateService },
  ],
})
export class ProjectModule {}
