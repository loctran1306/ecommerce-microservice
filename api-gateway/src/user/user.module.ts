import { AuthModule } from 'src/auth/auth.module';
import { UserController } from './user.controller';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { JwtStrategy } from 'src/auth/guard/jwt.strategy';

@Module({
  imports: [
    AuthModule, // Import AuthModule
    ClientsModule.register([
      {
        name: 'USER_SERVICE', // Define the name of the microservice
        transport: Transport.RMQ, // Define the transport protocol
        options: {
          urls: ['amqp://localhost:5672'], // Define the RabbitMQ URL
          queue: 'user_queue', // Define the queue name
          queueOptions: { durable: false }, // Define the queue options
        },
      },
    ]),
  ],

  controllers: [UserController],
  providers: [JwtStrategy],
})
export class UserModule {}
