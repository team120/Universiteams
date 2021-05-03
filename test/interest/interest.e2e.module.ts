import { Module } from '@nestjs/common';
import { InterestModule } from '../../src/interest/interest.module';
import { commonImportsArray } from '../utils/common-imports.e2e';

@Module({ imports: [...commonImportsArray, InterestModule] })
export class InterestE2EModule {}
