import { Module } from '@nestjs/common';
import { UserModule } from '../../src/user/user.module';
import { commonImportsArray } from '../utils/common-imports.e2e';

@Module({ imports: [...commonImportsArray, UserModule] })
export class UserE2EModule {}
