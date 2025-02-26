import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern({ cmd: 'register' })
  async register(@Payload() data: CreateUserDto) {
    return this.usersService.createUser(data);
  }

  @MessagePattern({ cmd: 'login' })
  async login(@Payload() data: { email: string; password: string }) {
    console.log('login', data);
    return this.usersService.validateUser(data.email, data.password);
  }
  @MessagePattern({ cmd: 'get_profile' })
  async getProfile(@Payload() data: { userId: number; email: string }) {
    return this.usersService.getProfile(data.userId, data.email);
  }
}
