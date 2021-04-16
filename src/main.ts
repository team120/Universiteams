import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppLogger } from './logger/app-logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useLogger(new AppLogger());
  await app.listen(3000);
}
bootstrap();
