import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Register
  @MessagePattern({ cmd: 'register' })
  async register(@Payload() data: CreateUserDto) {
    return this.usersService.createUser(data);
  }

  // Login
  @MessagePattern({ cmd: 'login' })
  async login(@Payload() data: { email: string; password: string }) {
    return this.usersService.validateUser(data.email, data.password);
  }

  // Refresh Token
  @MessagePattern({ cmd: 'refresh' })
  async refresh(@Payload() data: string) {
    return this.usersService.refreshToken(data);
  }

  // Get user info
  @MessagePattern({ cmd: 'get_profile' })
  async getProfile(
    @Payload() data: { user: { userId: number; email: string } },
  ) {
    const { userId, email } = data.user;
    return this.usersService.getProfile(userId, email);
  }

  // Get all users
  @MessagePattern({ cmd: 'get_users' })
  async getAllUser(
    @Payload() data: { user: { userId: number; email: string } },
  ) {
    return this.usersService.getAllUsers(data);
  }

  // Update user
  @MessagePattern({ cmd: 'update_user' })
  async updateUser(
    @Payload()
    data: {
      data: CreateUserDto;
      user: { userId: number; email: string };
    },
  ) {
    return this.usersService.updateUser(data);
  }

  // Delete user
  @MessagePattern({ cmd: 'delete_user' })
  async deleteUser(
    @Payload() data: { user: { userId: number; email: string } },
  ) {
    return this.usersService.deleteUser(data);
  }
}
