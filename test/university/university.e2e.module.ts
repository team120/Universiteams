import { Module } from '@nestjs/common';
import { UniversityModule } from '../../src/university/university.module';
import { commonImportsArray } from '../utils/common-imports.e2e';

@Module({ imports: [...commonImportsArray, UniversityModule] })
export class UniversityE2EModule {}
