import {
  Controller,
  Get,
  Inject,
  InternalServerErrorException,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(
    @Inject('USER_SERVICE') private readonly userService: ClientProxy,
  ) {}

  @Get('profile')
  async getProfile(@Req() request: Request) {
    console.log('Request received for profile:', request.user);

    try {
      const response = await this.userService
        .send({ cmd: 'get_profile' }, { user: request.user })
        .toPromise();
      console.log('Response from user-service:', response);
      return response;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw new InternalServerErrorException('Error fetching profile');
    }
  }

  @Get('all')
  async getAllUsers() {
    return this.userService.send({ cmd: 'get_users' }, {});
  }
}
