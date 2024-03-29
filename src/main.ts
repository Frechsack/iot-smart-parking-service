import { ConsoleLogger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule,{
      bufferLogs: true,
      cors: true
    });
  app.useLogger(new ConsoleLogger());
  await app.listen(3000);
}
bootstrap();
