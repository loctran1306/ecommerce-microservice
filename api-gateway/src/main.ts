import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  // Connect RabbitMQ
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://localhost:5672'],
      queue: 'api_gateway_queue',
      queueOptions: { durable: false },
    },
  });

  await app.startAllMicroservices();
  await app.listen(3000, () =>
    console.log('API Gateway is running on port 3000'),
  );
}
bootstrap();
