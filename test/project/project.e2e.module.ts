import { Module } from '@nestjs/common';
import { ProjectModule } from '../../src/project/project.module';
import { commonImportsArray } from '../utils/common-imports.e2e';

@Module({
  imports: [ProjectModule, ...commonImportsArray],
})
export class ProjectE2EModule { }
