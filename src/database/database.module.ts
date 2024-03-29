import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ViewRefresherService } from './view-refresher.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        database: configService.get('POSTGRES_DB'),
        host: configService.get('POSTGRES_HOST'),
        port: configService.get('POSTGRES_PORT'),
        username: configService.get('POSTGRES_USER'),
        password: configService.get('POSTGRES_PASSWORD'),
        entities: ['dist/**/*.entity{.ts,.js}'],
        migrations: ['dist/database/migrations/*{.ts,.js}'],
        migrationsRun: true,
        synchronize: false,
        logging: false,
        cli: { migrationsDir: 'src/database/migrations' },
      }),
    }),
  ],
  providers: [ViewRefresherService],
})
export class DatabaseModule {}
