require('dotenv').config();
import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'body-parser';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { RequestTimeLogInterceptor } from 'src/core/interceptors/RequestTimeLogInterceptor';
import { FileSDK } from '@oodles-dev/file-sdk';
import timeout from 'connect-timeout';
import { HttpExceptionFilter } from './core/filters/http-exception.filter';
FileSDK.fileApiUrl = process.env.API_FILE;

async function bootstrap() {
  const port = process.env.PORT || 3000;
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.use(
    urlencoded({ limit: '200mb', extended: true, parameterLimit: 1000000 }),
  );
  app.use(json({ limit: '200mb' }));
  app.use(timeout(1800000)); // 600,000=> 10Min, 1200,000=>20Min, 1800,000=>30Min
  app.useGlobalInterceptors(new RequestTimeLogInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  await app.listen(port);
  console.info(`Application started on port ${port}`);
}
bootstrap();
