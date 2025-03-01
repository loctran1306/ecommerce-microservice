import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users.entity';
import { JwtModule } from '@nestjs/jwt';
import { RedisService } from 'src/redis/redis.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret',
      signOptions: { expiresIn: '1m' },
    }),
    ClientsModule.register([
      {
        name: 'USER_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: 'user_queue',
          queueOptions: { durable: false },
        },
      },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService, RedisService],
})
export class UsersModule {}
