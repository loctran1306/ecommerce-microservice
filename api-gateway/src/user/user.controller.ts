import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  InternalServerErrorException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Request } from 'express';
import { request } from 'http';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(
    @Inject('USER_SERVICE') private readonly userService: ClientProxy,
  ) {}

  // Get user profile
  @Get('profile')
  async getProfile(@Req() request: Request) {
    return this.userService.send(
      { cmd: 'get_profile' },
      { user: request.user },
    );
  }

  // Get all users
  @Get('all')
  async getAllUsers(@Req() request: Request) {
    return this.userService.send({ cmd: 'get_users' }, { user: request.user });
  }

  // update user
  @Post('update')
  async updateUser(@Body() body: any, @Req() request: Request) {
    return this.userService.send(
      { cmd: 'update_user' },
      {
        data: body,
        user: request.user,
      },
    );
  }

  // Delete user
  @Delete('delete')
  async deleteUser(@Req() request: Request) {
    return this.userService.send(
      { cmd: 'delete_user' },
      { user: request.user },
    );
  }
}
