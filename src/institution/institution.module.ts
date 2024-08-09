import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SerializationModule } from '../utils/serialization/serialization.module';
import { InstitutionController } from './institution.controller';
import { Institution } from './institution.entity';
import { InstitutionService } from './institution.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Institution]),
    AuthModule,
    SerializationModule,
  ],
  providers: [InstitutionService],
  controllers: [InstitutionController],
})
export class InstitutionModule {}
