import { Module } from '@nestjs/common';
import { EntityMapperService } from './entity-mapper/entity-mapper.service';

@Module({ providers: [EntityMapperService], exports: [EntityMapperService] })
export class SharedModule {}
