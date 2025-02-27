import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  Transport,
  MicroserviceOptions,
  RpcException,
} from '@nestjs/microservices';
import { ResponseInterceptor } from './config/response/response.interceptor';
import { CustomRpcExceptionFilter } from './config/response/exception.filter';
import { ArgumentsHost, Catch, RpcExceptionFilter } from '@nestjs/common';
import { throwError } from 'rxjs';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: ['amqp://localhost:5672'],
        queue: 'user_queue',
        queueOptions: { durable: false },
      },
    },
  );

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new CustomRpcExceptionFilter());

  await app.listen();
  console.log('User Service is running...');
}
bootstrap();
