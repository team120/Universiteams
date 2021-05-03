import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SerializationModule } from '../serialization/serialization.module';
import { Interest } from './interest.entity';
import { InterestController } from './interest.controller';
import { InterestService } from './interest.service';

@Module({
    imports: [TypeOrmModule.forFeature([Interest]), SerializationModule],
    providers: [InterestService],
    controllers: [InterestController],
})
export class InterestModule { }
