import { Module } from '@nestjs/common';
import { InstitutionModule } from '../../src/institution/institution.module';
import { commonImportsArray } from '../utils/common-imports.e2e';

@Module({ imports: [...commonImportsArray, InstitutionModule] })
export class InstitutionE2EModule { }
