import { NestFactory } from '@nestjs/core';
import {
  DocumentBuilder,
  SwaggerCustomOptions,
  SwaggerModule,
} from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.use(cookieParser());

  const corsOptions = { origin: [process.env.FRONTEND_DEV_HOST], }
  app.enableCors(corsOptions);

  const config = new DocumentBuilder()
    .setTitle('Universiteams API')
    .setDescription(
      'Universiteams: Pro Scientific Dissemination' +
        '\n\n' +
        '\tTo get access and refresh token cookies (http-only same-site) use login or register endpoints.' +
        '\n\n' +
        '\tYour browser will place them in SetCookie headers automatically. (withCredential: true)',
    )
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const customOptions: SwaggerCustomOptions = {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      withCredentials: true,
    },
  };

  SwaggerModule.setup('docs', app, document, customOptions);

  await app.listen(3000);
}
bootstrap();
